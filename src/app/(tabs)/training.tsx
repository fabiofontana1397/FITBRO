import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionHeader } from '@/components/ui/section-header';
import { PlanExerciseRow } from '@/components/training/plan-exercise-row';
import { PlanTimeline } from '@/components/training/plan-timeline';
import { WeekStrip, type WeekStripDayType } from '@/components/training/week-strip';
import { Radius, Spacing } from '@/constants/theme';
import { useStoreHydrated } from '@/hooks/use-store-hydrated';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, currentWeekDates, daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { currentMonthIndex } from '@/lib/planning/plan-progress';
import type { TrainingDayPlan } from '@/lib/planning/types';
import { useOnboardingStore } from '@/store/onboarding-store';
import { isValidTrainingPlan, usePlanStore } from '@/store/plan-store';
import {
  historyForExercise,
  isExerciseCompleted,
  latestWeightForExercise,
  setsForExerciseOnDate,
  useTrainingProgressStore,
} from '@/store/training-progress-store';
import { useUserStore } from '@/store/user-store';

const PHASE_LABEL: Record<string, string> = {
  adattamento: 'Adattamento',
  progressione: 'Progressione',
  consolidamento: 'Consolidamento',
};

export default function TrainingScreen() {
  const theme = useTheme();
  const trainingPlan = usePlanStore((s) => s.trainingPlan);
  const generatePlans = usePlanStore((s) => s.generatePlans);
  const onboardingAnswers = useOnboardingStore((s) => s.answers);
  const currentUser = useUserStore();
  const progressSets = useTrainingProgressStore((s) => s.sets);
  const completedExercises = useTrainingProgressStore((s) => s.completed);
  const logSet = useTrainingProgressStore((s) => s.logSet);
  const toggleCompleted = useTrainingProgressStore((s) => s.toggleCompleted);

  const [selectedDate, setSelectedDate] = useState(daysAgoISO(0));
  const weekDates = useMemo(() => currentWeekDates(new Date(selectedDate)), [selectedDate]);
  const monthYearLabel = useMemo(() => {
    const label = new Date(weekDates[0]).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [weekDates]);

  const goToPrevWeek = () => setSelectedDate((d) => addDaysISO(d, -7));
  const goToNextWeek = () => setSelectedDate((d) => addDaysISO(d, 7));

  const planStoreHydrated = useStoreHydrated(usePlanStore);
  const onboardingHydrated = useStoreHydrated(useOnboardingStore);
  const userStoreHydrated = useStoreHydrated(useUserStore);

  useEffect(() => {
    // Persisted stores rehydrate from AsyncStorage asynchronously. Without
    // this gate, a returning user's plan/onboarding answers/profile could
    // still be at their in-memory defaults on first render, generating (and
    // permanently caching) a plan from empty/default data — the trainingPlan
    // dependency below would then never change to retrigger it.
    if (!planStoreHydrated || !onboardingHydrated || !userStoreHydrated) return;
    if (isValidTrainingPlan(trainingPlan) || onboardingAnswers.mode === 'diet') return;
    generatePlans(onboardingAnswers, {
      dailyCalorieTarget: currentUser.dailyCalorieTarget,
      macroTargetsG: currentUser.macroTargetsG,
    });
    // Only needs to run once per missing/invalid-plan case, not on every keystroke of onboardingAnswers/currentUser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingPlan, planStoreHydrated, onboardingHydrated, userStoreHydrated]);

  const monthIndex = trainingPlan ? currentMonthIndex(trainingPlan) : 1;
  const currentMonth = trainingPlan?.months.find((m) => m.monthIndex === monthIndex);
  const weeklySplit = currentMonth?.weeklySplit ?? [];
  const dayTypes: WeekStripDayType[] = weeklySplit.map((d) => d.type);
  const selectedDay: TrainingDayPlan | undefined = weeklySplit[mondayIndex(new Date(selectedDate))];

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Il tuo programma" title="Training" />

      {!trainingPlan ? (
        <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four, gap: Spacing.two }}>
          <ThemedText type="smallBold">Nessun programma generato</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Rifai il questionario scegliendo sala pesi o corsa tra le attività per generarne uno.
          </ThemedText>
        </GlassSurface>
      ) : (
        <>
          <View>
            <SectionHeader title="Il tuo piano" />
            <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.five, gap: Spacing.five }}>
              <View style={styles.planMetaRow}>
                <View style={styles.planMetaItem}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Durata piano totale
                  </ThemedText>
                  <ThemedText type="smallBold">{trainingPlan.durationMonths} mesi</ThemedText>
                </View>
                <View style={[styles.planMetaDivider, { backgroundColor: theme.border }]} />
                <View style={styles.planMetaItem}>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Scheda attuale
                  </ThemedText>
                  <ThemedText type="smallBold">
                    Mese {monthIndex} · {PHASE_LABEL[currentMonth?.phase ?? 'adattamento']}
                  </ThemedText>
                </View>
              </View>
              <PlanTimeline
                totalMonths={trainingPlan.durationMonths}
                currentMonth={monthIndex}
                selectedMonth={monthIndex}
                onSelectMonth={() => router.push('/training-plan')}
              />
              <PrimaryButton
                variant="ghost"
                label="Mostra piano"
                icon="chevronRight"
                onPress={() => router.push('/training-plan')}
              />
            </GlassSurface>
          </View>

          <View style={{ gap: Spacing.three }}>
            <SectionHeader title="Calendario" />
            <View style={styles.monthNavRow}>
              <Pressable onPress={goToPrevWeek} hitSlop={10} style={styles.navArrow}>
                <Icon name="arrowBack" size={18} color={theme.textSecondary} />
              </Pressable>
              <ThemedText type="smallBold">{monthYearLabel}</ThemedText>
              <Pressable onPress={goToNextWeek} hitSlop={10} style={styles.navArrow}>
                <Icon name="chevronRight" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
            <WeekStrip dates={weekDates} dayTypes={dayTypes} selectedDate={selectedDate} onSelect={setSelectedDate} />
          </View>

          {selectedDay?.type === 'workout' ? (
            <View>
              <SectionHeader
                title={selectedDay.title}
                icon="trendUp"
                iconLabel="Carichi"
                onIconPress={() => router.push('/training-progress')}
              />
              <View style={{ gap: Spacing.three }}>
                {(selectedDay.exercises ?? []).map((exercise) => {
                  const setsToday = setsForExerciseOnDate(progressSets, exercise.id, selectedDate);
                  const loggedTodayKg = setsToday.length ? Math.max(...setsToday.map((s) => s.weightKg)) : null;
                  return (
                    <PlanExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                      history={historyForExercise(progressSets, exercise.id)}
                      latestWeightKg={latestWeightForExercise(progressSets, exercise.id)}
                      loggedTodayKg={loggedTodayKg}
                      completed={isExerciseCompleted(completedExercises, exercise.id, selectedDate)}
                      onToggleCompleted={() => toggleCompleted(exercise.id, selectedDate)}
                      onAddLoad={(reps, weightKg) => logSet(exercise.id, exercise.name, reps, weightKg, selectedDate)}
                    />
                  );
                })}
              </View>
            </View>
          ) : selectedDay?.type === 'cardio' ? (
            <GlassSurface level="card" radius={Radius.large} style={styles.dayCard}>
              <View style={[styles.dayIcon, { backgroundColor: theme.accentSoft }]}>
                <Icon name="running" size={26} color={theme.accent} />
              </View>
              <ThemedText type="subtitle">{selectedDay.title}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {selectedDay.note}
              </ThemedText>
            </GlassSurface>
          ) : (
            <GlassSurface level="card" radius={Radius.large} style={styles.dayCard}>
              <View style={[styles.dayIcon, { backgroundColor: theme.backgroundElement }]}>
                <Icon name="moon" size={26} color={theme.textSecondary} />
              </View>
              <ThemedText type="subtitle">Giorno di riposo</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                Il recupero fa parte del piano: dormi bene e resta idratato.
              </ThemedText>
            </GlassSurface>
          )}
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  planMetaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.four,
  },
  planMetaItem: {
    flex: 1,
    gap: 4,
  },
  planMetaDivider: {
    width: StyleSheet.hairlineWidth,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.four,
  },
  navArrow: {
    padding: Spacing.one,
  },
  dayCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
  },
  dayIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

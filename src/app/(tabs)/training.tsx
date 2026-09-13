import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

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
import { useTheme } from '@/hooks/use-theme';
import { currentWeekDates, daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { currentMonthIndex } from '@/lib/planning/plan-progress';
import type { TrainingDayPlan } from '@/lib/planning/types';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePlanStore } from '@/store/plan-store';
import {
  historyForExercise,
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
  const logSet = useTrainingProgressStore((s) => s.logSet);
  const removeSet = useTrainingProgressStore((s) => s.removeSet);

  const weekDates = useMemo(() => currentWeekDates(), []);
  const [selectedDate, setSelectedDate] = useState(daysAgoISO(0));

  useEffect(() => {
    if (trainingPlan || onboardingAnswers.mode === 'diet') return;
    generatePlans(onboardingAnswers, {
      dailyCalorieTarget: currentUser.dailyCalorieTarget,
      macroTargetsG: currentUser.macroTargetsG,
    });
    // Only needs to run once per missing-plan case, not on every keystroke of onboardingAnswers/currentUser.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingPlan]);

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
            <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four, gap: Spacing.three }}>
              <PlanTimeline
                totalMonths={trainingPlan.durationMonths}
                currentMonth={monthIndex}
                currentLabel={`Mese ${monthIndex} · ${PHASE_LABEL[currentMonth?.phase ?? 'adattamento']}`}
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
            <WeekStrip dates={weekDates} dayTypes={dayTypes} selectedDate={selectedDate} onSelect={setSelectedDate} />
          </View>

          {selectedDay?.type === 'workout' ? (
            <View>
              <SectionHeader title={selectedDay.title} />
              <View style={{ gap: Spacing.three }}>
                {(selectedDay.exercises ?? []).map((exercise, exerciseIndex) => (
                  <PlanExerciseRow
                    key={`${exercise.id}-${exerciseIndex}`}
                    exercise={exercise}
                    setsToday={setsForExerciseOnDate(progressSets, exercise.id, selectedDate)}
                    history={historyForExercise(progressSets, exercise.id)}
                    latestWeightKg={latestWeightForExercise(progressSets, exercise.id)}
                    onAddSet={(reps, weightKg) => logSet(exercise.id, exercise.name, reps, weightKg, selectedDate)}
                    onRemoveSet={removeSet}
                  />
                ))}
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

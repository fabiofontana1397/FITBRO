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
import { StatTile } from '@/components/ui/stat-tile';
import { ExerciseLogRow } from '@/components/training/exercise-log-row';
import { WeekStrip } from '@/components/training/week-strip';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentWeekDates, daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { sportIcon, sportMeta } from '@/lib/mock/training';
import type { Sport } from '@/lib/mock/types';
import { useOnboardingStore } from '@/store/onboarding-store';
import { usePlanStore } from '@/store/plan-store';
import {
  exerciseTopSetHistory,
  planAdherence,
  setsForExerciseOnDate,
  templateById,
  useTrainingStore,
  type ExerciseSetLog,
  type WorkoutTemplate,
} from '@/store/training-store';
import { useUserStore } from '@/store/user-store';

export default function TrainingScreen() {
  const { plan, templates, logs, logSet } = useTrainingStore();
  const weekDates = useMemo(() => currentWeekDates(), []);
  const [selectedDate, setSelectedDate] = useState(daysAgoISO(0));
  const trainingPlan = usePlanStore((s) => s.trainingPlan);
  const generatePlans = usePlanStore((s) => s.generatePlans);
  const onboardingAnswers = useOnboardingStore((s) => s.answers);
  const currentUser = useUserStore();

  const planDay = plan[mondayIndex(new Date(selectedDate))];
  const todayPlanDay = plan[mondayIndex(new Date())];
  const { planned, done } = useMemo(() => planAdherence(plan, logs, 14), [plan, logs]);

  useEffect(() => {
    if (trainingPlan || onboardingAnswers.mode === 'diet') return;
    generatePlans(onboardingAnswers, {
      dailyCalorieTarget: currentUser.dailyCalorieTarget,
      macroTargetsG: currentUser.macroTargetsG,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingPlan]);

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Scheda settimanale" title="Training" />

      <View style={styles.statsRow}>
        <StatTile label="Aderenza piano" value={`${done}/${planned}`} unit="ultimi 14gg" icon="check" />
        <StatTile
          label="Oggi"
          value={
            todayPlanDay.type === 'workout'
              ? templateById(templates, todayPlanDay.templateId)?.dayLabel ?? '—'
              : todayPlanDay.type === 'cardio'
                ? todayPlanDay.label
                : 'Riposo'
          }
          icon={todayPlanDay.type === 'workout' ? 'gym' : todayPlanDay.type === 'cardio' ? sportIcon[todayPlanDay.sport] : 'moon'}
        />
      </View>

      <View>
        <SectionHeader title="Il tuo programma" />
        <GlassSurface level="card" radius={Radius.large} style={styles.planCard}>
          {trainingPlan ? (
            <>
              <View style={{ flex: 1, gap: 2 }}>
                <ThemedText type="smallBold">Programma di {trainingPlan.durationMonths} mesi</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {trainingPlan.months[0].title}: {trainingPlan.months[0].focusNote}
                </ThemedText>
              </View>
              <PrimaryButton label="Vedi piano" onPress={() => router.push('/training-plan')} style={styles.planButton} />
            </>
          ) : (
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="smallBold">Nessun programma generato</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Rifai il questionario scegliendo sala pesi o corsa tra le attività per generarne uno.
              </ThemedText>
            </View>
          )}
        </GlassSurface>
      </View>

      <WeekStrip dates={weekDates} plan={plan} selectedDate={selectedDate} onSelect={setSelectedDate} />

      {planDay.type === 'workout' ? (
        <WorkoutDay
          templateId={planDay.templateId}
          date={selectedDate}
          logs={logs}
          templates={templates}
          onAddSet={(exerciseId, reps, weightKg) => logSet(planDay.templateId, exerciseId, reps, weightKg, selectedDate)}
        />
      ) : planDay.type === 'cardio' ? (
        <CardioDay label={planDay.label} sport={planDay.sport} durationMin={planDay.durationMin} />
      ) : (
        <RestDay />
      )}
    </ScreenScroll>
  );
}

function WorkoutDay({
  templateId,
  date,
  logs,
  templates,
  onAddSet,
}: {
  templateId: string;
  date: string;
  logs: ExerciseSetLog[];
  templates: WorkoutTemplate[];
  onAddSet: (exerciseId: string, reps: number, weightKg: number) => void;
}) {
  const template = templateById(templates, templateId);
  if (!template) return null;

  return (
    <View>
      <SectionHeader title={template.title} />
      <View style={{ gap: Spacing.three }}>
        {template.exercises.map((exercise) => (
          <ExerciseLogRow
            key={exercise.id}
            exercise={exercise}
            setsToday={setsForExerciseOnDate(logs, exercise.id, date)}
            history={exerciseTopSetHistory(logs, exercise.id)}
            onAddSet={(reps, weightKg) => onAddSet(exercise.id, reps, weightKg)}
          />
        ))}
      </View>
    </View>
  );
}

function CardioDay({ label, sport, durationMin }: { label: string; sport: Sport; durationMin: number }) {
  const theme = useTheme();
  return (
    <GlassSurface level="card" radius={Radius.large} style={styles.dayCard}>
      <View style={[styles.dayIcon, { backgroundColor: theme.accentSoft }]}>
        <Icon name={sportIcon[sport]} size={26} color={theme.accent} />
      </View>
      <ThemedText type="subtitle">{label}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {sportMeta[sport].label} · {durationMin} min
      </ThemedText>
    </GlassSurface>
  );
}

function RestDay() {
  const theme = useTheme();
  return (
    <GlassSurface level="card" radius={Radius.large} style={styles.dayCard}>
      <View style={[styles.dayIcon, { backgroundColor: theme.backgroundElement }]}>
        <Icon name="moon" size={26} color={theme.textSecondary} />
      </View>
      <ThemedText type="subtitle">Giorno di riposo</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
        Il recupero fa parte del piano: dormi bene e resta idratato.
      </ThemedText>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  planButton: {
    flexShrink: 0,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
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

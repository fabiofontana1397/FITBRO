import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { ExerciseLogRow } from '@/components/training/exercise-log-row';
import { WeekStrip } from '@/components/training/week-strip';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { currentWeekDates, daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { sportIcon, sportMeta } from '@/lib/mock/training';
import type { Sport } from '@/lib/mock/types';
import {
  exerciseTopSetHistory,
  planAdherence,
  setsForExerciseOnDate,
  templateById,
  useTrainingStore,
  type ExerciseSetLog,
  type WorkoutTemplate,
} from '@/store/training-store';

export default function TrainingScreen() {
  const { plan, templates, logs, logSet } = useTrainingStore();
  const weekDates = useMemo(() => currentWeekDates(), []);
  const [selectedDate, setSelectedDate] = useState(daysAgoISO(0));

  const planDay = plan[mondayIndex(new Date(selectedDate))];
  const todayPlanDay = plan[mondayIndex(new Date())];
  const { planned, done } = useMemo(() => planAdherence(plan, logs, 14), [plan, logs]);

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

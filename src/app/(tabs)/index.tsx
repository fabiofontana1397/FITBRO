import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { GoalTrendChart } from '@/components/ui/goal-trend-chart';
import { InsightCard } from '@/components/ui/insight-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { Icon, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dailyStepsTarget, stepsHistory } from '@/lib/mock/activity';
import { latestSnapshot, seriesOf } from '@/lib/mock/body';
import { daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { insights } from '@/lib/mock/progress';
import { currentMonthIndex } from '@/lib/planning/plan-progress';
import type { TrainingExerciseEntry } from '@/lib/planning/types';
import { useBodyStore } from '@/store/body-store';
import { sumMacros, useNutritionStore } from '@/store/nutrition-store';
import { usePlanStore } from '@/store/plan-store';
import { historyForExercise, isExerciseCompleted, useTrainingProgressStore } from '@/store/training-progress-store';
import { useUserStore } from '@/store/user-store';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function HomeScreen() {
  const theme = useTheme();
  const currentUser = useUserStore();
  const today = daysAgoISO(0);

  const trainingPlan = usePlanStore((s) => s.trainingPlan);
  const dietPlan = usePlanStore((s) => s.dietPlan);
  const completedExercises = useTrainingProgressStore((s) => s.completed);
  const loggedSets = useTrainingProgressStore((s) => s.sets);
  const nutritionEntries = useNutritionStore((s) => s.entries);
  const bodyEntries = useBodyStore((s) => s.entries);

  // Same weeklySplit[weekday] lookup training.tsx uses for the selected day
  // — here always pinned to today, so the ring/card below track the exact
  // same tick marks the Training tab shows, not the separate legacy plan
  // the dashboard used to read from.
  const todayPlanDay = useMemo(() => {
    if (!trainingPlan) return undefined;
    const monthIdx = currentMonthIndex(trainingPlan);
    const month = trainingPlan.months.find((m) => m.monthIndex === monthIdx);
    return month?.weeklySplit[mondayIndex(new Date(today))];
  }, [trainingPlan, today]);

  const workoutExercises = todayPlanDay?.type === 'workout' ? (todayPlanDay.exercises ?? []) : [];
  const completedCount = workoutExercises.filter((ex) => isExerciseCompleted(completedExercises, ex.id, today)).length;
  // Rest/cardio days (or no plan at all) have no checkboxes to tick, so the
  // ring simply reads as "done" rather than stuck at some arbitrary partial
  // value.
  const trainingProgress =
    todayPlanDay?.type === 'workout' ? (workoutExercises.length > 0 ? completedCount / workoutExercises.length : 1) : 1;

  // The generated diet plan's OWN calorie/macro targets for the active
  // month (they can differ month to month) take priority over the static
  // profile defaults, since those are what the plan actually asks for today.
  const dietMonth = dietPlan?.months.find((m) => m.monthIndex === currentMonthIndex(dietPlan));
  const calorieTarget = dietMonth?.calorieTarget ?? currentUser.dailyCalorieTarget;
  const macroTargets = dietMonth?.macroTargetsG ?? currentUser.macroTargetsG;

  const todaysTotals = sumMacros(nutritionEntries.filter((e) => e.date === today));
  const dietProgress = calorieTarget > 0 ? Math.min(todaysTotals.kcal / calorieTarget, 1) : 0;

  const todaysSteps = stepsHistory[stepsHistory.length - 1]?.steps ?? 0;
  const stepsProgress = Math.min(todaysSteps / dailyStepsTarget, 1);

  const planIcon: IconName =
    !todayPlanDay || todayPlanDay.type === 'workout' ? 'training' : todayPlanDay.type === 'cardio' ? 'running' : 'moon';
  const planTitle = !todayPlanDay ? 'Nessun programma' : todayPlanDay.type === 'rest' ? 'Giorno di riposo' : todayPlanDay.title;
  const planSubtitle = !todayPlanDay
    ? 'Genera un programma dalla scheda Training.'
    : todayPlanDay.type === 'workout'
      ? `${workoutExercises.length} esercizi · ${completedCount}/${workoutExercises.length} completati`
      : todayPlanDay.type === 'cardio'
        ? (todayPlanDay.note ?? 'Sessione cardio')
        : 'Recupero attivo';

  const latestBody = latestSnapshot(bodyEntries);
  const startBody = bodyEntries[0];
  const totalToLose = startBody.weightKg - currentUser.targetWeightKg;
  const doneSoFar = startBody.weightKg - latestBody.weightKg;
  const weightProgress = totalToLose > 0 ? Math.min(doneSoFar / totalToLose, 1) : 1;
  const remainingKg = Math.max(latestBody.weightKg - currentUser.targetWeightKg, 0);

  // Every exercise appearing anywhere in the plan (same de-duplication
  // training-progress.tsx uses), so "recent" lifts aren't limited to today.
  const exercisesInPlan = useMemo(() => {
    if (!trainingPlan) return [];
    const byId = new Map<string, TrainingExerciseEntry>();
    for (const month of trainingPlan.months) {
      for (const day of month.weeklySplit) {
        if (day.type !== 'workout') continue;
        for (const ex of day.exercises ?? []) {
          if (!byId.has(ex.id)) byId.set(ex.id, ex);
        }
      }
    }
    return [...byId.values()];
  }, [trainingPlan]);

  const recentLifts = useMemo(() => {
    const withHistory = exercisesInPlan
      .map((exercise) => ({ exercise, history: historyForExercise(loggedSets, exercise.id) }))
      .filter((l) => l.history.length >= 2);
    return withHistory
      .sort((a, b) => b.history[b.history.length - 1].date.localeCompare(a.history[a.history.length - 1].date))
      .slice(0, 3);
  }, [exercisesInPlan, loggedSets]);

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow={`${greeting()}`} title={currentUser.name} />

      <View>
        <SectionHeader title="Obiettivo peso" action="Vedi corpo" onActionPress={() => router.push('/body')} />
        <GlassSurface level="card" radius={Radius.large} style={styles.goalCard}>
          <View style={styles.goalHeaderRow}>
            <View style={{ gap: 2 }}>
              <ThemedText type="title">{latestBody.weightKg.toFixed(1)} kg</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Target {currentUser.targetWeightKg} kg · {remainingKg.toFixed(1)} kg al target
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {Math.round(weightProgress * 100)}%
            </ThemedText>
          </View>
          <GoalTrendChart
            data={seriesOf(bodyEntries, 'weightKg')}
            target={currentUser.targetWeightKg}
            height={100}
            color={theme.accent}
            targetColor={theme.textTertiary}
          />
        </GlassSurface>
      </View>

      <View>
        <SectionHeader title="Riepilogo di oggi" />
        <GlassSurface level="card" radius={Radius.large} style={styles.overviewCard}>
          <View style={styles.ringsStack}>
            <ProgressRing size={128} strokeWidth={12} progress={trainingProgress} color={theme.accent} trackColor={theme.backgroundElement}>
              <ProgressRing size={92} strokeWidth={10} progress={dietProgress} color={theme.success} trackColor={theme.backgroundElement}>
                <ProgressRing size={58} strokeWidth={8} progress={stepsProgress} color={theme.warning} trackColor={theme.backgroundElement} />
              </ProgressRing>
            </ProgressRing>
          </View>
          <View style={styles.legendColumn}>
            <OverviewLegendRow icon="training" color={theme.accent} label="Allenamento" value={`${Math.round(trainingProgress * 100)}%`} />
            <OverviewLegendRow icon="nutrition" color={theme.success} label="Dieta" value={`${Math.round(dietProgress * 100)}%`} />
            <OverviewLegendRow icon="footsteps" color={theme.warning} label="Passi" value={`${Math.round(stepsProgress * 100)}%`} />
          </View>
        </GlassSurface>
      </View>

      <View>
        <SectionHeader title="Allenamento di oggi" action="Vedi training" onActionPress={() => router.push('/training')} />
        <GlassSurface level="card" radius={Radius.large}>
          <Pressable style={styles.planRow} onPress={() => router.push('/training')}>
            <View style={[styles.sportBadge, { backgroundColor: theme.accentSoft }]}>
              <Icon name={planIcon} size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <ThemedText type="smallBold">{planTitle}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {planSubtitle}
              </ThemedText>
            </View>
            <Icon name="chevronRight" size={18} color={theme.textTertiary} />
          </Pressable>
        </GlassSurface>
      </View>

      <View>
        <SectionHeader title="Piano alimentare di oggi" action="Dettagli" onActionPress={() => router.push('/nutrition')} />
        <GlassSurface level="card" radius={Radius.large} style={styles.nutritionCard}>
          <View style={styles.calorieRow}>
            <ThemedText type="title">{Math.round(todaysTotals.kcal)}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {' '}
              / {Math.round(calorieTarget)} kcal
            </ThemedText>
          </View>
          <View style={styles.macroRingsRow}>
            <MacroRingStat
              icon="protein"
              label="Proteine"
              color={theme.accent}
              value={`${Math.round(todaysTotals.protein)}g`}
              progress={macroTargets.protein > 0 ? todaysTotals.protein / macroTargets.protein : 0}
            />
            <MacroRingStat
              icon="carbs"
              label="Carboidrati"
              color={theme.success}
              value={`${Math.round(todaysTotals.carbs)}g`}
              progress={macroTargets.carbs > 0 ? todaysTotals.carbs / macroTargets.carbs : 0}
            />
            <MacroRingStat
              icon="fats"
              label="Grassi"
              color={theme.warning}
              value={`${Math.round(todaysTotals.fats)}g`}
              progress={macroTargets.fats > 0 ? todaysTotals.fats / macroTargets.fats : 0}
            />
          </View>
        </GlassSurface>
      </View>

      {recentLifts.length > 0 ? (
        <View>
          <SectionHeader title="Ultimi progressi nei carichi" action="Vedi tutti" onActionPress={() => router.push('/training-progress')} />
          <View style={{ gap: Spacing.three }}>
            {recentLifts.map(({ exercise, history }) => {
              const firstKg = history[0].weightKg;
              const lastKg = history[history.length - 1].weightKg;
              const deltaPct = firstKg > 0 ? ((lastKg - firstKg) / firstKg) * 100 : 0;
              return (
                <GlassSurface key={exercise.id} level="card" radius={Radius.large}>
                  <View style={styles.liftRow}>
                    <View style={[styles.liftIcon, { backgroundColor: theme.accentSoft }]}>
                      <Icon name="training" size={18} color={theme.accent} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <ThemedText type="smallBold">{exercise.name}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        {firstKg}kg → {lastKg}kg
                      </ThemedText>
                    </View>
                    <ThemedText type="smallBold" style={{ color: deltaPct >= 0 ? theme.success : theme.danger }}>
                      {deltaPct >= 0 ? '+' : ''}
                      {deltaPct.toFixed(1)}%
                    </ThemedText>
                  </View>
                </GlassSurface>
              );
            })}
          </View>
        </View>
      ) : null}

      <View>
        <SectionHeader title="Consigli del coach AI" />
        <View style={{ gap: Spacing.three }}>
          {insights.map((insight) => (
            <InsightCard key={insight.id} tone={insight.tone} headline={insight.headline} body={insight.body} />
          ))}
        </View>
      </View>
    </ScreenScroll>
  );
}

function OverviewLegendRow({ icon, color, label, value }: { icon: IconName; color: string; label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Icon name={icon} size={14} color={theme.textSecondary} />
      <ThemedText type="caption" themeColor="textSecondary" style={{ flex: 1 }}>
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

function MacroRingStat({
  icon,
  label,
  color,
  value,
  progress,
}: {
  icon: IconName;
  label: string;
  color: string;
  value: string;
  progress: number;
}) {
  const theme = useTheme();
  return (
    <View style={styles.macroRingCol}>
      <ProgressRing size={60} strokeWidth={6} progress={progress} color={color} trackColor={theme.backgroundElement}>
        <Icon name={icon} size={16} color={color} />
      </ProgressRing>
      <ThemedText type="caption" style={{ marginTop: Spacing.one, fontWeight: '700' }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  sportBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCard: {
    gap: Spacing.three,
    padding: Spacing.four,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  ringsStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendColumn: {
    flex: 1,
    gap: Spacing.three,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutritionCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  macroRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroRingCol: {
    alignItems: 'center',
    flex: 1,
  },
  liftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  liftIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

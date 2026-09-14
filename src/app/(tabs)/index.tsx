import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { GoalTrendChart, type WeightPoint } from '@/components/ui/goal-trend-chart';
import { InsightCard } from '@/components/ui/insight-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { WeeklyBurnChart } from '@/components/ui/weekly-burn-chart';
import { Icon, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dailyStepsTarget, stepsHistory } from '@/lib/mock/activity';
import { latestSnapshot } from '@/lib/mock/body';
import { currentWeekDates, daysAgoISO, mondayIndex, monthShortLabel, weekdayShort } from '@/lib/mock/dates';
import { insights } from '@/lib/mock/progress';
import { estimateDailyBurnedKcal } from '@/lib/nutrition/targets';
import { WEEKDAY_LABELS } from '@/lib/planning/exercise-library';
import { currentMonthIndex } from '@/lib/planning/plan-progress';
import type { TrainingExerciseEntry } from '@/lib/planning/types';
import { useBodyStore } from '@/store/body-store';
import { useNutritionStore, sumMacros } from '@/store/nutrition-store';
import { useOnboardingStore } from '@/store/onboarding-store';
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
  const onboardingAnswers = useOnboardingStore((s) => s.answers);
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

  // The generated diet plan's OWN calorie/macro targets for the active
  // month (they can differ month to month) take priority over the static
  // profile defaults, since those are what the plan actually asks for today.
  const dietMonth = dietPlan?.months.find((m) => m.monthIndex === currentMonthIndex(dietPlan));
  const calorieTarget = dietMonth?.calorieTarget ?? currentUser.dailyCalorieTarget;
  const macroTargets = dietMonth?.macroTargetsG ?? currentUser.macroTargetsG;

  const todaysTotals = sumMacros(nutritionEntries.filter((e) => e.date === today));
  const dietProgress = calorieTarget > 0 ? Math.min(todaysTotals.kcal / calorieTarget, 1) : 0;

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
  const doneSoFar = startBody.weightKg - latestBody.weightKg;

  // Rest/cardio days (or no plan at all) have no checkboxes to tick, so a
  // day only counts as "trained" once every exercise on an actual workout
  // day was actually completed — matching the same rule weekDays uses below.
  const todayTrainedThisDay =
    todayPlanDay?.type === 'workout' && workoutExercises.length > 0 && completedCount === workoutExercises.length;
  const todayBurnedKcal = estimateDailyBurnedKcal({
    sex: currentUser.sex,
    ageRange: currentUser.ageRange,
    heightCm: currentUser.heightCm,
    weightKg: latestBody.weightKg,
    jobActivity: onboardingAnswers.jobActivity as string | undefined,
    trainedThisDay: todayTrainedThisDay,
  });
  const burnedProgress = calorieTarget > 0 ? Math.min(todayBurnedKcal / calorieTarget, 1) : 0;

  // Week/month/year switches which fixed set of axis slots the chart shows
  // — days of this week, days of this month, months of this year — each
  // slot keeping its gridline/label even when nothing was logged for it
  // yet, so the axes always read as a complete chart rather than only
  // appearing once data exists.
  const [weightRange, setWeightRange] = useState<'settimana' | 'mese' | 'anno'>('settimana');
  const weightSeries = useMemo<WeightPoint[]>(() => {
    const byDate = new Map<string, number[]>();
    for (const e of bodyEntries) {
      const bucket = byDate.get(e.date) ?? [];
      bucket.push(e.weightKg);
      byDate.set(e.date, bucket);
    }
    const avgFor = (date: string) => {
      const values = byDate.get(date);
      if (!values || values.length === 0) return null;
      return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
    };

    const now = new Date();

    if (weightRange === 'settimana') {
      return currentWeekDates(now).map((date) => ({ xLabel: weekdayShort(date), value: avgFor(date), date }));
    }

    if (weightRange === 'mese') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const dayCount = new Date(year, month + 1, 0).getDate();
      return Array.from({ length: dayCount }, (_, i) => {
        const date = `${year}-${(month + 1).toString().padStart(2, '0')}-${(i + 1).toString().padStart(2, '0')}`;
        return { xLabel: `${i + 1}`, value: avgFor(date), date };
      });
    }

    // anno
    const year = now.getFullYear();
    const sums = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }));
    for (const [date, values] of byDate) {
      const d = new Date(date);
      if (d.getFullYear() !== year) continue;
      const bucket = sums[d.getMonth()];
      bucket.sum += values.reduce((sum, v) => sum + v, 0);
      bucket.count += values.length;
    }
    return sums.map((bucket, i) => ({
      xLabel: monthShortLabel(year, i),
      value: bucket.count > 0 ? Math.round((bucket.sum / bucket.count) * 10) / 10 : null,
      date: `${year}-${(i + 1).toString().padStart(2, '0')}-01`,
    }));
  }, [bodyEntries, weightRange]);
  const weightDateGranularity = weightRange === 'anno' ? 'month' : 'day';

  // One entry per weekday of the CURRENT calendar week — past days read
  // from what was actually logged, today is live, and days still ahead
  // simply have nothing yet (0% rings, no burn plotted) rather than a
  // fabricated forecast.
  const weekDates = useMemo(() => currentWeekDates(new Date()), []);
  const weekDays = useMemo(() => {
    const monthIdx = trainingPlan ? currentMonthIndex(trainingPlan) : null;
    const month = trainingPlan?.months.find((m) => m.monthIndex === monthIdx);
    const split = month?.weeklySplit ?? [];

    return weekDates.map((date, i) => {
      const dayPlan = split[i];
      const exercises = dayPlan?.type === 'workout' ? (dayPlan.exercises ?? []) : [];
      const completed = exercises.filter((ex) => isExerciseCompleted(completedExercises, ex.id, date)).length;
      const dayTrainingProgress = dayPlan?.type === 'workout' ? (exercises.length > 0 ? completed / exercises.length : 1) : 1;
      const trainedThisDay = dayPlan?.type === 'workout' && exercises.length > 0 && completed === exercises.length;

      const dayTotals = sumMacros(nutritionEntries.filter((e) => e.date === date));
      const dayDietProgress = calorieTarget > 0 ? Math.min(dayTotals.kcal / calorieTarget, 1) : 0;

      const stepsEntry = stepsHistory.find((s) => s.date === date);
      const dayStepsProgress = stepsEntry ? Math.min(stepsEntry.steps / dailyStepsTarget, 1) : 0;

      const burnedKcal = estimateDailyBurnedKcal({
        sex: currentUser.sex,
        ageRange: currentUser.ageRange,
        heightCm: currentUser.heightCm,
        weightKg: latestBody.weightKg,
        jobActivity: onboardingAnswers.jobActivity as string | undefined,
        trainedThisDay,
      });

      return {
        date,
        label: WEEKDAY_LABELS[i][0],
        isToday: date === today,
        hasHappened: date <= today,
        trainingProgress: dayTrainingProgress,
        dietProgress: dayDietProgress,
        stepsProgress: dayStepsProgress,
        burnedKcal,
        eatenKcal: dayTotals.kcal,
      };
    });
  }, [trainingPlan, weekDates, completedExercises, nutritionEntries, calorieTarget, currentUser, latestBody.weightKg, onboardingAnswers, today]);

  const todayBurn = weekDays.find((d) => d.isToday);
  const weekBurnedSoFar = weekDays.filter((d) => d.hasHappened).reduce((sum, d) => sum + d.burnedKcal, 0);
  const weekEatenSoFar = weekDays.filter((d) => d.hasHappened).reduce((sum, d) => sum + d.eatenKcal, 0);
  const weekDeficit = weekBurnedSoFar - weekEatenSoFar;
  const todayDeficit = todayBurn ? todayBurn.burnedKcal - todayBurn.eatenKcal : 0;
  // What eating exactly the plan's daily calorie target across every
  // planned day this week would add up to — negative for a deficit plan,
  // positive for a surplus one. Uses each day's own estimated burn (higher
  // on trained days) rather than a flat TDEE.
  const weeklyDeficitGoal = weekDays.reduce((sum, d) => sum + (calorieTarget - d.burnedKcal), 0);

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
        <SectionHeader title="Obiettivo" action="Vedi corpo" onActionPress={() => router.push('/body')} />
        <GlassSurface level="card" radius={Radius.large} style={styles.goalCard}>
          <SegmentedControl
            options={[
              { value: 'settimana', label: 'Settimana' },
              { value: 'mese', label: 'Mese' },
              { value: 'anno', label: 'Anno' },
            ]}
            value={weightRange}
            onChange={(v) => setWeightRange(v as typeof weightRange)}
          />

          <View style={styles.goalEmphasisRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="caption" themeColor="textSecondary">
                Peso attuale
              </ThemedText>
              <ThemedText type="subtitle">{latestBody.weightKg.toFixed(1)} kg</ThemedText>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <ThemedText type="caption" themeColor="textSecondary">
                Progressi finora
              </ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name={doneSoFar > 0 ? 'trendDown' : 'trendUp'} size={14} color={doneSoFar > 0 ? theme.success : theme.danger} />
                <ThemedText type="subtitle" style={{ color: doneSoFar > 0 ? theme.success : theme.danger }}>
                  {doneSoFar > 0 ? '-' : '+'}
                  {Math.abs(doneSoFar).toFixed(1)} kg
                </ThemedText>
              </View>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <ThemedText type="caption" themeColor="textSecondary">
                Peso target
              </ThemedText>
              <ThemedText type="subtitle" style={{ color: theme.success }}>
                {currentUser.targetWeightKg} kg
              </ThemedText>
            </View>
          </View>

          <GoalTrendChart
            points={weightSeries}
            target={currentUser.targetWeightKg}
            dateGranularity={weightDateGranularity}
            height={240}
            color={theme.accent}
            targetColor={theme.success}
            axisColor={theme.textTertiary}
            gridColor={theme.backgroundElement}
          />
        </GlassSurface>
      </View>

      <View>
        <SectionHeader title="Riepilogo di oggi" />
        <GlassSurface level="card" radius={Radius.large} style={styles.overviewCard}>
          <View style={styles.ringsStack}>
            <ProgressRing size={128} strokeWidth={12} progress={burnedProgress} color={theme.accent} trackColor={theme.backgroundElement}>
              <ProgressRing size={92} strokeWidth={10} progress={dietProgress} color={theme.success} trackColor={theme.backgroundElement} />
            </ProgressRing>
          </View>
          <View style={styles.legendColumn}>
            <OverviewLegendRow icon="training" color={theme.accent} label="Bruciate" value={`${Math.round(todayBurnedKcal)} kcal`} />
            <OverviewLegendRow icon="nutrition" color={theme.success} label="Assunte" value={`${Math.round(todaysTotals.kcal)} kcal`} />
          </View>
        </GlassSurface>

        <GlassSurface level="card" radius={Radius.large} style={styles.burnCard}>
          <View style={{ gap: Spacing.two }}>
            <ThemedText type="smallBold">Calorie bruciate e assunte</ThemedText>
            <View style={styles.burnEmphasisRow}>
              <View style={{ flex: 1 }}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Oggi
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name={todayDeficit >= 0 ? 'trendDown' : 'trendUp'} size={14} color={todayDeficit >= 0 ? theme.success : theme.danger} />
                  <ThemedText type="subtitle" style={{ color: todayDeficit >= 0 ? theme.success : theme.danger }}>
                    {todayDeficit >= 0 ? '-' : '+'}
                    {Math.abs(Math.round(todayDeficit))} kcal
                  </ThemedText>
                </View>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Questa settimana
                </ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Icon name={weekDeficit >= 0 ? 'trendDown' : 'trendUp'} size={14} color={weekDeficit >= 0 ? theme.success : theme.danger} />
                  <ThemedText type="subtitle" style={{ color: weekDeficit >= 0 ? theme.success : theme.danger }}>
                    {weekDeficit >= 0 ? '-' : '+'}
                    {Math.abs(Math.round(weekDeficit))} kcal
                  </ThemedText>
                </View>
              </View>
            </View>
          </View>
          <WeeklyBurnChart
            days={weekDays.map((d) => ({
              label: d.label,
              date: d.date,
              burnedKcal: d.burnedKcal,
              eatenKcal: d.eatenKcal,
              isToday: d.isToday,
              hasHappened: d.hasHappened,
              rings: { training: d.trainingProgress, diet: d.dietProgress, steps: d.stepsProgress },
            }))}
            burnedColor={theme.accent}
            eatenColor={theme.success}
            deficitColor={theme.calorieDeficit}
            surplusColor={theme.calorieSurplus}
            weeklyDeficitGoal={weeklyDeficitGoal}
            goalColor={theme.textSecondary}
            trackColor={theme.backgroundElement}
            axisColor={theme.textTertiary}
            todayBadgeColor={theme.accent}
            todayBadgeTextColor={theme.onAccent}
            trainingColor={theme.accent}
            dietColor={theme.success}
            stepsColor={theme.warning}
          />
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
  goalEmphasisRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  overviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  burnCard: {
    marginTop: Spacing.three,
    gap: Spacing.three,
    padding: Spacing.four,
  },
  burnEmphasisRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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

import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { GoalTrendChart } from '@/components/ui/goal-trend-chart';
import { InsightCard } from '@/components/ui/insight-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { WeeklyBurnChart } from '@/components/ui/weekly-burn-chart';
import { Icon, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dailyStepsTarget, stepsHistory } from '@/lib/mock/activity';
import { latestSnapshot } from '@/lib/mock/body';
import { addDaysISO, currentWeekDates, daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { insights } from '@/lib/mock/progress';
import { computeNutritionTargets, deriveWeeklyTrainingDays, estimateDailyBurnedKcal } from '@/lib/nutrition/targets';
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

  const weightHistory = useMemo(() => bodyEntries.map((e) => ({ date: e.date, value: e.weightKg })), [bodyEntries]);

  // The plan's OWN intended trajectory — one grey milestone per month,
  // same count as the training/nutrition plan's own duration, fixed to
  // when the plan started rather than recalculated from "today" — so it
  // reads as a roadmap real progress can be checked against, not a
  // forecast that keeps sliding. Recomputes maintenance (TDEE) against
  // each month's own calorie target (diet plans nudge month 1 easier, then
  // hold steady — see diet-planner.ts monthCalorieTarget), compounding
  // forward and holding flat once the target is reached rather than
  // overshooting past it in later months.
  const monthlyGuide = useMemo(() => {
    const targetWeightKg = currentUser.targetWeightKg;
    const totalMonths = dietPlan?.durationMonths ?? trainingPlan?.durationMonths ?? 0;
    if (totalMonths === 0) return [];

    const months = dietPlan
      ? [...dietPlan.months].sort((a, b) => a.monthIndex - b.monthIndex).map((m) => ({ calorieTarget: m.calorieTarget }))
      : Array.from({ length: totalMonths }, () => ({ calorieTarget: currentUser.dailyCalorieTarget }));

    const planStartDate = (dietPlan?.generatedAt ?? trainingPlan?.generatedAt ?? today).slice(0, 10);
    const points: { date: string; value: number }[] = [];
    let weight = startBody.weightKg;
    let reached = Math.abs(weight - targetWeightKg) < 0.05;
    let cursorDate = planStartDate;

    for (const month of months) {
      cursorDate = addDaysISO(cursorDate, 30);
      if (!reached) {
        const { tdee } = computeNutritionTargets({
          sex: currentUser.sex,
          ageRange: currentUser.ageRange,
          heightCm: currentUser.heightCm,
          currentWeightKg: weight,
          goal: currentUser.goal,
          jobActivity: onboardingAnswers.jobActivity as string | undefined,
          weeklyTrainingDays: deriveWeeklyTrainingDays(onboardingAnswers),
        });
        const dailyDeficit = tdee - month.calorieTarget;
        const monthlyChangeKg = -(dailyDeficit * 30) / 7700; // ~7700kcal per kg of fat
        const movingTowardTarget = monthlyChangeKg < 0 ? targetWeightKg < weight : monthlyChangeKg > 0 ? targetWeightKg > weight : false;
        if (movingTowardTarget) {
          weight += monthlyChangeKg;
          const crossed = monthlyChangeKg < 0 ? weight <= targetWeightKg : weight >= targetWeightKg;
          if (crossed) {
            weight = targetWeightKg;
            reached = true;
          }
        }
      }
      points.push({ date: cursorDate, value: weight });
    }

    return points;
  }, [currentUser, startBody.weightKg, onboardingAnswers, dietPlan, trainingPlan, today]);

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
          <View style={styles.goalHeaderRow}>
            <View style={{ gap: 2 }}>
              <ThemedText type="title">{latestBody.weightKg.toFixed(1)} kg</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Target {currentUser.targetWeightKg} kg · {remainingKg.toFixed(1)} kg al target
              </ThemedText>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                {Math.round(weightProgress * 100)}%
              </ThemedText>
              {doneSoFar !== 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Icon name={doneSoFar > 0 ? 'trendDown' : 'trendUp'} size={12} color={doneSoFar > 0 ? theme.success : theme.danger} />
                  <ThemedText type="caption" style={{ color: doneSoFar > 0 ? theme.success : theme.danger, fontWeight: '700' }}>
                    {doneSoFar > 0 ? '-' : '+'}
                    {Math.abs(doneSoFar).toFixed(1)}kg finora
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>

          {/* A plain filling bar makes the advancement toward the target
              unmistakable at a glance, on top of (not instead of) the trend
              line below — the line alone wasn't reading as visible
              progress. */}
          <View style={[styles.goalProgressTrack, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.goalProgressFill, { width: `${Math.round(weightProgress * 100)}%`, backgroundColor: theme.accent }]} />
          </View>
          <View style={styles.goalProgressLabels}>
            <ThemedText type="caption" themeColor="textSecondary">
              {startBody.weightKg.toFixed(1)} kg
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {currentUser.targetWeightKg} kg
            </ThemedText>
          </View>

          <GoalTrendChart
            history={weightHistory}
            guide={monthlyGuide}
            target={currentUser.targetWeightKg}
            height={180}
            color={theme.accent}
            guideColor={theme.textTertiary}
            targetColor={theme.success}
            axisColor={theme.textTertiary}
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

        <GlassSurface level="card" radius={Radius.large} style={styles.burnCard}>
          <View style={{ gap: 2 }}>
            <View style={styles.burnHeaderRow}>
              <ThemedText type="smallBold">Calorie bruciate e assunte</ThemedText>
              <View style={[styles.weekDeltaChip, { backgroundColor: (weekDeficit >= 0 ? theme.success : theme.danger) + '26' }]}>
                <ThemedText type="caption" style={{ color: weekDeficit >= 0 ? theme.success : theme.danger, fontWeight: '700' }}>
                  {weekDeficit >= 0 ? '+' : ''}
                  {Math.round(weekDeficit)} kcal/sett.
                </ThemedText>
              </View>
            </View>
            <View style={styles.burnLegendRow}>
              <View style={styles.burnLegendItem}>
                <View style={[styles.burnLegendDot, { backgroundColor: theme.accent }]} />
                <ThemedText type="caption" themeColor="textSecondary">
                  Bruciate
                </ThemedText>
              </View>
              <View style={styles.burnLegendItem}>
                <View style={[styles.burnLegendDot, { backgroundColor: theme.success }]} />
                <ThemedText type="caption" themeColor="textSecondary">
                  Assunte
                </ThemedText>
              </View>
              <ThemedText type="caption" style={{ marginLeft: 'auto', color: todayDeficit >= 0 ? theme.success : theme.danger, fontWeight: '700' }}>
                Oggi {todayDeficit >= 0 ? '+' : ''}
                {Math.round(todayDeficit)} kcal
              </ThemedText>
            </View>
          </View>
          <WeeklyBurnChart
            days={weekDays.map((d) => ({
              label: d.label,
              burnedKcal: d.burnedKcal,
              eatenKcal: d.eatenKcal,
              isToday: d.isToday,
              hasHappened: d.hasHappened,
              rings: { training: d.trainingProgress, diet: d.dietProgress, steps: d.stepsProgress },
            }))}
            burnedColor={theme.accent}
            eatenColor={theme.success}
            deficitColor={theme.success}
            surplusColor={theme.danger}
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
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  goalProgressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.two,
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
  burnHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekDeltaChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  burnLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  burnLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  burnLegendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
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

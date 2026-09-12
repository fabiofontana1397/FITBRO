import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { InsightCard } from '@/components/ui/insight-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { Icon, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dailyStepsTarget, daysAboveStepTarget, stepsHistory } from '@/lib/mock/activity';
import { latestSnapshot } from '@/lib/mock/body';
import { daysAgoISO, mondayIndex } from '@/lib/mock/dates';
import { correlationNote, insights } from '@/lib/mock/progress';
import { sportIcon, sportMeta } from '@/lib/mock/training';
import { currentUser } from '@/lib/mock/user';
import { useBodyStore } from '@/store/body-store';
import { sumMacros, useNutritionStore } from '@/store/nutrition-store';
import {
  isTemplateLoggedOnDate,
  keyLiftProgress,
  planAdherence,
  templateById,
  useTrainingStore,
} from '@/store/training-store';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function HomeScreen() {
  const theme = useTheme();
  const today = daysAgoISO(0);
  const { plan, templates, logs } = useTrainingStore();
  const nutritionEntries = useNutritionStore((s) => s.entries);
  const bodyEntries = useBodyStore((s) => s.entries);

  const planIndex = mondayIndex(new Date());
  const planDay = plan[planIndex];
  const template = planDay.type === 'workout' ? templateById(templates, planDay.templateId) : undefined;
  const workoutDone = planDay.type === 'workout' && isTemplateLoggedOnDate(logs, planDay.templateId, today);

  const todaysTotals = sumMacros(nutritionEntries.filter((e) => e.date === today));
  const nutritionProgress = Math.min(todaysTotals.kcal / currentUser.dailyCalorieTarget, 1);
  const trainingProgress = planDay.type === 'rest' ? 1 : workoutDone ? 1 : 0.25;
  const readinessProgress = 0.82;

  const planIcon: IconName = planDay.type === 'workout' ? 'gym' : planDay.type === 'cardio' ? sportIcon[planDay.sport] : 'moon';
  const planTitle = planDay.type === 'workout' ? template?.title ?? 'Allenamento' : planDay.type === 'cardio' ? planDay.label : 'Giorno di riposo';
  const planSubtitle =
    planDay.type === 'workout'
      ? `${sportMeta.gym.label} · ${workoutDone ? 'Completato' : 'Pianificato'}`
      : planDay.type === 'cardio'
        ? `${sportMeta[planDay.sport].label} · ${planDay.durationMin} min`
        : 'Recupero attivo';

  const latestBody = latestSnapshot(bodyEntries);
  const startBody = bodyEntries[0];
  const totalToLose = startBody.weightKg - currentUser.targetWeightKg;
  const doneSoFar = startBody.weightKg - latestBody.weightKg;
  const weightProgress = totalToLose > 0 ? Math.min(doneSoFar / totalToLose, 1) : 1;
  const remainingKg = Math.max(latestBody.weightKg - currentUser.targetWeightKg, 0);

  const { planned, done } = planAdherence(plan, logs, 14);
  const adherencePct = planned ? done / planned : 0;
  const lifts = keyLiftProgress(logs, templates);
  const stepsAbove = daysAboveStepTarget();

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow={`${greeting()}`} title={currentUser.name} />

      <View style={styles.ringsRow}>
        <RingStat
          label="Training"
          value={trainingProgress >= 1 ? 'Fatto' : `${Math.round(trainingProgress * 100)}%`}
          progress={trainingProgress}
          icon="training"
          color={theme.accent}
        />
        <RingStat
          label="Nutrizione"
          value={`${Math.round(nutritionProgress * 100)}%`}
          progress={nutritionProgress}
          icon="nutrition"
          color={theme.success}
        />
        <RingStat
          label="Recovery"
          value={`${Math.round(readinessProgress * 100)}%`}
          progress={readinessProgress}
          icon="heart"
          color={theme.warning}
        />
      </View>

      <View>
        <SectionHeader title="Piano di oggi" action="Vedi training" onActionPress={() => router.push('/training')} />
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
        <SectionHeader title="Nutrizione di oggi" action="Dettagli" onActionPress={() => router.push('/nutrition')} />
        <View style={styles.statsRow}>
          <StatTile label="Calorie" value={`${Math.round(todaysTotals.kcal)}`} unit={`/ ${currentUser.dailyCalorieTarget} kcal`} />
          <StatTile label="Proteine" value={`${Math.round(todaysTotals.protein)}`} unit={`/ ${currentUser.macroTargetsG.protein} g`} />
        </View>
      </View>

      <View>
        <SectionHeader title="Obiettivo peso" action="Vedi corpo" onActionPress={() => router.push('/body')} />
        <GlassSurface level="card" radius={Radius.large} style={styles.goalCard}>
          <ProgressRing size={104} strokeWidth={10} progress={weightProgress} color={theme.accent} trackColor={theme.backgroundElement}>
            <ThemedText type="title">{remainingKg.toFixed(1)}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              kg al target
            </ThemedText>
          </ProgressRing>
          <View style={{ flex: 1, gap: 4 }}>
            <ThemedText type="caption" themeColor="textSecondary">
              Da {startBody.weightKg.toFixed(1)} kg a {latestBody.weightKg.toFixed(1)} kg, target {currentUser.targetWeightKg} kg.
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
              {Math.round(weightProgress * 100)}% del percorso completato
            </ThemedText>
          </View>
        </GlassSurface>
      </View>

      <View style={styles.metricsGrid}>
        <MetricTile
          icon="check"
          label="Aderenza piano"
          value={`${done}/${planned}`}
          detail="allenamenti fatti su pianificati (14gg)"
          progress={adherencePct}
        />
        <MetricTile
          icon="footsteps"
          label="Giorni sopra target passi"
          value={`${stepsAbove}/${stepsHistory.length}`}
          detail={`target ${dailyStepsTarget.toLocaleString('it-IT')} passi/giorno`}
          progress={stepsAbove / stepsHistory.length}
        />
      </View>

      {lifts.length > 0 ? (
        <View>
          <SectionHeader title="Progressione carichi" />
          <View style={{ gap: Spacing.three }}>
            {lifts.map((lift) => (
              <GlassSurface key={lift.exerciseId} level="card" radius={Radius.large}>
                <View style={styles.liftRow}>
                  <View style={[styles.liftIcon, { backgroundColor: theme.accentSoft }]}>
                    <Icon name="gym" size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="smallBold">{lift.name}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {lift.firstKg}kg → {lift.lastKg}kg
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={{ color: lift.deltaPct >= 0 ? theme.success : theme.danger }}>
                    {lift.deltaPct >= 0 ? '+' : ''}
                    {lift.deltaPct.toFixed(1)}%
                  </ThemedText>
                </View>
              </GlassSurface>
            ))}
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

      <View>
        <SectionHeader title="Correlazioni" />
        <GlassSurface level="card" radius={Radius.large} style={styles.correlationCard}>
          <Icon name="sparkle" size={20} color={theme.accent} />
          <ThemedText type="small" style={{ flex: 1 }}>
            {correlationNote}
          </ThemedText>
        </GlassSurface>
      </View>

      <PrimaryButton label="Registra un allenamento" icon="plus" onPress={() => router.push('/training')} />
    </ScreenScroll>
  );
}

function RingStat({
  label,
  value,
  progress,
  icon,
  color,
}: {
  label: string;
  value: string;
  progress: number;
  icon: IconName;
  color: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.ringCol}>
      <ProgressRing size={76} strokeWidth={8} progress={progress} color={color} trackColor={theme.backgroundElement}>
        <Icon name={icon} size={20} color={color} />
      </ProgressRing>
      <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>
        {value}
      </ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

function MetricTile({
  icon,
  label,
  value,
  detail,
  progress,
}: {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
  progress: number;
}) {
  const theme = useTheme();
  return (
    <GlassSurface level="card" radius={Radius.large} style={styles.metricTile}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, { backgroundColor: theme.accentSoft }]}>
          <Icon name={icon} size={16} color={theme.accent} />
        </View>
        <ThemedText type="label" themeColor="textSecondary" style={{ flex: 1 }}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="title">{value}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {detail}
      </ThemedText>
      <View style={[styles.metricTrack, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.metricFill, { width: `${Math.min(progress, 1) * 100}%`, backgroundColor: theme.accent }]} />
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ringCol: {
    alignItems: 'center',
    flex: 1,
  },
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
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metricTile: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  metricIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
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
  correlationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
});

import { StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { InsightCard } from '@/components/ui/insight-card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dailyStepsTarget, daysAboveStepTarget, stepsHistory } from '@/lib/mock/activity';
import { latestSnapshot } from '@/lib/mock/body';
import { currentUser } from '@/lib/mock/user';
import { correlationNote, insights } from '@/lib/mock/progress';
import { useBodyStore } from '@/store/body-store';
import { keyLiftProgress, planAdherence, useTrainingStore } from '@/store/training-store';

export default function ProgressScreen() {
  const theme = useTheme();
  const bodyEntries = useBodyStore((s) => s.entries);
  const { plan, logs, templates } = useTrainingStore();

  const latest = latestSnapshot(bodyEntries);
  const start = bodyEntries[0];
  const totalToLose = start.weightKg - currentUser.targetWeightKg;
  const doneSoFar = start.weightKg - latest.weightKg;
  const weightProgress = totalToLose > 0 ? Math.min(doneSoFar / totalToLose, 1) : 1;
  const remainingKg = Math.max(latest.weightKg - currentUser.targetWeightKg, 0);

  const { planned, done } = planAdherence(plan, logs, 14);
  const adherencePct = planned ? done / planned : 0;

  const lifts = keyLiftProgress(logs, templates);
  const stepsAbove = daysAboveStepTarget();

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Analisi cross-dominio" title="Progressi" />

      <GlassSurface level="card" radius={Radius.large} style={styles.heroCard}>
        <ProgressRing size={128} strokeWidth={12} progress={weightProgress} color={theme.accent} trackColor={theme.backgroundElement}>
          <ThemedText type="title">{remainingKg.toFixed(1)}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            kg al target
          </ThemedText>
        </ProgressRing>
        <View style={{ flex: 1, gap: 4 }}>
          <ThemedText type="smallBold">Obiettivo peso</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            Da {start.weightKg.toFixed(1)} kg a {latest.weightKg.toFixed(1)} kg, target {currentUser.targetWeightKg} kg.
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
            {Math.round(weightProgress * 100)}% del percorso completato
          </ThemedText>
        </View>
      </GlassSurface>

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
    </ScreenScroll>
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
  heroCard: {
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

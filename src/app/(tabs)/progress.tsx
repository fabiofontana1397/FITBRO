import { StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { InsightCard } from '@/components/ui/insight-card';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { correlationNote, goalProgress, insights } from '@/lib/mock';

export default function ProgressScreen() {
  const theme = useTheme();

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Analisi cross-dominio" title="Progressi" />

      <View>
        <SectionHeader title="Distanza dall'obiettivo" />
        <View style={{ gap: Spacing.three }}>
          {goalProgress.map((goal) => (
            <GlassSurface key={goal.label} level="card" radius={Radius.large} style={{ padding: Spacing.three }}>
              <View style={styles.goalHeader}>
                <ThemedText type="smallBold">{goal.label}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {goal.detail}
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.fill, { width: `${goal.progress * 100}%`, backgroundColor: theme.accent }]} />
              </View>
            </GlassSurface>
          ))}
        </View>
      </View>

      <View>
        <SectionHeader title="Cosa migliora, cosa peggiora" />
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

const styles = StyleSheet.create({
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  correlationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
});

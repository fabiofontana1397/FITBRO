import { StyleSheet, View } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ScreenHeader } from '@/components/screen-header';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { PrimaryButton } from '@/components/ui/primary-button';
import { SectionHeader } from '@/components/ui/section-header';
import { StatTile } from '@/components/ui/stat-tile';
import { TrendChart } from '@/components/ui/trend-chart';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { bodyHistory, latestSnapshot, percentChange, seriesOf } from '@/lib/mock';

export default function BodyScreen() {
  const theme = useTheme();
  const latest = latestSnapshot();

  const measurements = [
    { label: 'Vita', value: `${latest.waistCm} cm`, key: 'waistCm' as const },
    { label: 'Petto', value: `${latest.chestCm} cm`, key: 'chestCm' as const },
    { label: 'Fianchi', value: `${latest.hipsCm} cm`, key: 'hipsCm' as const },
  ];

  return (
    <ScreenScroll>
      <ScreenHeader eyebrow="Composizione corporea" title="Corpo" />

      <View style={styles.statsRow}>
        <StatTile
          label="Peso"
          value={latest.weightKg.toFixed(1)}
          unit="kg"
          trend={percentChange('weightKg')}
          trendGoodDirection="down"
          sparkline={seriesOf('weightKg')}
        />
        <StatTile
          label="Massa grassa"
          value={latest.bodyFatPct.toFixed(1)}
          unit="%"
          trend={percentChange('bodyFatPct')}
          trendGoodDirection="down"
          sparkline={seriesOf('bodyFatPct')}
        />
      </View>
      <View style={styles.statsRow}>
        <StatTile
          label="Massa muscolare"
          value={latest.muscleMassKg.toFixed(1)}
          unit="kg"
          trend={percentChange('muscleMassKg')}
          sparkline={seriesOf('muscleMassKg')}
        />
        <StatTile
          label="FC a riposo"
          value={`${latest.restingHeartRate}`}
          unit="bpm"
          trend={percentChange('restingHeartRate')}
          trendGoodDirection="down"
          sparkline={seriesOf('restingHeartRate')}
        />
      </View>

      <View>
        <SectionHeader title="Andamento peso (12 settimane)" />
        <GlassSurface level="card" radius={Radius.large} style={{ padding: Spacing.four, alignItems: 'center' }}>
          <TrendChart data={seriesOf('weightKg')} width={280} height={110} color={theme.accent} />
        </GlassSurface>
      </View>

      <View>
        <SectionHeader title="Misure" />
        <View style={{ gap: Spacing.three }}>
          {measurements.map((m) => (
            <GlassSurface key={m.key} level="card" radius={Radius.large}>
              <View style={styles.measureRow}>
                <Icon name="ruler" size={18} color={theme.textTertiary} />
                <ThemedText type="small" style={{ flex: 1 }}>
                  {m.label}
                </ThemedText>
                <ThemedText type="smallBold">{m.value}</ThemedText>
              </View>
            </GlassSurface>
          ))}
        </View>
      </View>

      <View>
        <SectionHeader title="Confronto foto" />
        <GlassSurface level="card" radius={Radius.large} style={styles.photoCard}>
          <Icon name="camera" size={28} color={theme.textTertiary} />
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            Aggiungi una foto ogni settimana per confrontare i tuoi progressi nel tempo
          </ThemedText>
          <PrimaryButton label="Aggiungi foto" variant="outline" icon="camera" />
        </GlassSurface>
      </View>

      <ThemedText type="caption" themeColor="textTertiary" style={{ textAlign: 'center' }}>
        {bodyHistory.length} rilevazioni · sonno medio {(
          bodyHistory.reduce((a, b) => a + b.sleepHours, 0) / bodyHistory.length
        ).toFixed(1)}
        h
      </ThemedText>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  measureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  photoCard: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
});

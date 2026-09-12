import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { GlassSurface } from '@/components/glass/glass-surface';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';
import { TrendChart } from '@/components/ui/trend-chart';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type StatTileProps = {
  label: string;
  value: string;
  unit?: string;
  icon?: IconName;
  trend?: number; // signed percent
  /** Which direction of `trend` should read as "good" (green). @default 'up' */
  trendGoodDirection?: 'up' | 'down';
  sparkline?: number[];
  style?: StyleProp<ViewStyle>;
};

export function StatTile({
  label,
  value,
  unit,
  icon,
  trend,
  trendGoodDirection = 'up',
  sparkline,
  style,
}: StatTileProps) {
  const theme = useTheme();
  const trendPositive = (trend ?? 0) >= 0;
  const trendIsGood = trendPositive === (trendGoodDirection === 'up');
  const trendIcon: IconName = trend == null ? 'trendFlat' : trendPositive ? 'trendUp' : 'trendDown';
  const trendColor = trend == null ? theme.textTertiary : trendIsGood ? theme.success : theme.danger;

  return (
    <GlassSurface level="card" radius={Radius.large} style={[styles.wrapper, style]}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <ThemedText type="label" themeColor="textSecondary">
            {label}
          </ThemedText>
          {icon ? <Icon name={icon} size={16} color={theme.textTertiary} /> : null}
        </View>

        <View style={styles.valueRow}>
          <ThemedText type="title">{value}</ThemedText>
          {unit ? (
            <ThemedText type="caption" themeColor="textSecondary" style={styles.unit}>
              {unit}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.footerRow}>
          {trend != null ? (
            <View style={styles.trendChip}>
              <Icon name={trendIcon} size={12} color={trendColor} />
              <ThemedText type="caption" style={{ color: trendColor }}>
                {Math.abs(trend).toFixed(1)}%
              </ThemedText>
            </View>
          ) : (
            <View />
          )}
          {sparkline ? (
            <TrendChart data={sparkline} width={72} height={28} color={theme.accent} />
          ) : null}
        </View>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    minWidth: 150,
    flexGrow: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  unit: {
    marginBottom: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});

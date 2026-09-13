import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PlanTimelineProps = {
  totalMonths: number;
  currentMonth: number;
  currentLabel: string;
};

/** Total/current-scheda summary + a month-by-month chip row — future months stay
 * greyed out and unlock one at a time as the current month advances. */
export function PlanTimeline({ totalMonths, currentMonth, currentLabel }: PlanTimelineProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: Spacing.three }}>
      <View style={styles.metaRow}>
        <MetaItem label="Durata piano totale" value={`${totalMonths} mesi`} />
        <MetaItem label="Durata scheda" value="1 mese" />
      </View>
      <View style={{ gap: 2 }}>
        <ThemedText type="caption" themeColor="textSecondary">
          Scheda attuale
        </ThemedText>
        <ThemedText type="smallBold">{currentLabel}</ThemedText>
      </View>
      <View style={styles.chipsRow}>
        {Array.from({ length: totalMonths }, (_, i) => i + 1).map((month) => {
          const isCurrent = month === currentMonth;
          const isPast = month < currentMonth;
          return (
            <View
              key={month}
              style={[
                styles.chip,
                { backgroundColor: isCurrent ? theme.accent : theme.backgroundElement, opacity: isPast ? 0.7 : 1 },
              ]}>
              <ThemedText
                type="caption"
                style={{ color: isCurrent ? theme.onAccent : theme.textTertiary, fontWeight: '700' }}>
                {month}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ gap: 2 }}>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  chip: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

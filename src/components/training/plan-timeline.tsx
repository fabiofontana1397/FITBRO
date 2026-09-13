import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PlanTimelineProps = {
  totalMonths: number;
  /** The month unlocked so far by real elapsed time — months beyond this are locked. */
  currentMonth: number;
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
};

/** A month-by-month chip bar. Unlocked months (<= currentMonth) can be opened in
 * full; later ones stay greyed out and locked until the plan reaches them. */
export function PlanTimeline({ totalMonths, currentMonth, selectedMonth, onSelectMonth }: PlanTimelineProps) {
  const theme = useTheme();

  return (
    <View style={styles.chipsRow}>
      {Array.from({ length: totalMonths }, (_, i) => i + 1).map((month) => {
        const isUnlocked = month <= currentMonth;
        const isSelected = month === selectedMonth;
        return (
          <Pressable key={month} onPress={() => onSelectMonth(month)} style={styles.chipWrap}>
            <View
              style={[
                styles.chip,
                { backgroundColor: isSelected ? theme.accent : theme.backgroundElement },
                !isSelected && { borderWidth: 1.5, borderColor: isUnlocked ? theme.accent : 'transparent' },
              ]}>
              {isUnlocked ? (
                <ThemedText
                  type="caption"
                  style={{ color: isSelected ? theme.onAccent : theme.text, fontWeight: '700' }}>
                  {month}
                </ThemedText>
              ) : (
                <Icon name="lock" size={13} color={isSelected ? theme.onAccent : theme.textTertiary} />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chipWrap: {
    padding: 2,
  },
  chip: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

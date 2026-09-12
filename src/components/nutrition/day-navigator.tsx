import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatFullDay, isToday } from '@/lib/mock/dates';

export type DayNavigatorProps = {
  date: string;
  onPrev: () => void;
  onNext: () => void;
};

export function DayNavigator({ date, onPrev, onNext }: DayNavigatorProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Pressable onPress={onPrev} hitSlop={10} style={styles.arrow}>
        <Icon name="arrowBack" size={20} color={theme.textSecondary} />
      </Pressable>
      <View style={styles.label}>
        <ThemedText type="smallBold">{isToday(date) ? 'Oggi' : formatFullDay(date)}</ThemedText>
      </View>
      <Pressable onPress={onNext} hitSlop={10} style={styles.arrow}>
        <Icon name="chevronRight" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    padding: Spacing.two,
  },
  label: {
    flex: 1,
    alignItems: 'center',
  },
});

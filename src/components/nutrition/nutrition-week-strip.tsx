import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isToday, weekdayShort } from '@/lib/mock/dates';

export type NutritionWeekStripProps = {
  dates: string[];
  loggedDates: Set<string>;
  selectedDate: string;
  onSelect: (date: string) => void;
};

export function NutritionWeekStrip({ dates, loggedDates, selectedDate, onSelect }: NutritionWeekStripProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {dates.map((date) => {
        const selected = date === selectedDate;
        const logged = loggedDates.has(date);
        const today = isToday(date);

        return (
          <Pressable key={date} onPress={() => onSelect(date)} style={styles.cell}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.letter}>
              {weekdayShort(date).slice(0, 1).toUpperCase()}
            </ThemedText>
            <View
              style={[
                styles.circle,
                { backgroundColor: logged ? theme.success : theme.backgroundElement },
                selected && { borderWidth: 2, borderColor: theme.accent },
                !selected && today && { borderWidth: 1.5, borderColor: theme.accent },
              ]}>
              {logged ? (
                <Icon name="check" size={14} color={theme.onAccent} />
              ) : (
                <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 11 }}>
                  {new Date(date).getDate()}
                </ThemedText>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  letter: {
    fontSize: 11,
  },
  circle: {
    width: '68%',
    aspectRatio: 1,
    maxWidth: 40,
    minWidth: 26,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

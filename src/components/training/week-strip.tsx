import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dayOfMonth, isToday, weekdayShort } from '@/lib/mock/dates';

export type WeekStripDayType = 'workout' | 'cardio' | 'rest';

export type WeekStripProps = {
  dates: string[];
  dayTypes: WeekStripDayType[];
  selectedDate: string;
  onSelect: (date: string) => void;
};

function dotColorFor(dayType: WeekStripDayType | undefined, theme: ReturnType<typeof useTheme>) {
  if (dayType === 'cardio') return theme.success;
  if (dayType === 'workout') return theme.accent;
  return theme.textTertiary;
}

export function WeekStrip({ dates, dayTypes, selectedDate, onSelect }: WeekStripProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {dates.map((date, index) => {
        const dayType = dayTypes[index];
        const selected = date === selectedDate;
        const today = isToday(date);
        return (
          <Pressable key={date} onPress={() => onSelect(date)} style={styles.cell}>
            <View
              style={[
                styles.pill,
                { backgroundColor: selected ? theme.accent : theme.backgroundElement },
                today && !selected && { borderWidth: 1.5, borderColor: theme.accent },
              ]}>
              <ThemedText
                type="caption"
                style={{ color: selected ? theme.onAccent : theme.textSecondary, fontSize: 11 }}>
                {weekdayShort(date).slice(0, 3)}
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: selected ? theme.onAccent : theme.text }}>
                {dayOfMonth(date)}
              </ThemedText>
              <View style={[styles.dot, { backgroundColor: selected ? theme.onAccent : dotColorFor(dayType, theme) }]} />
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
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  cell: {
    flex: 1,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
});

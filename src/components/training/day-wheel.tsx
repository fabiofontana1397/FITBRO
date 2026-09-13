import { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { addDaysISO, dayOfMonth, daysAgoISO, isToday, weekdayShort } from '@/lib/mock/dates';

export type DayWheelDayType = 'workout' | 'cardio' | 'rest';

export type DayWheelProps = {
  selectedDate: string;
  dayTypeForDate: (date: string) => DayWheelDayType | undefined;
  onSelect: (date: string) => void;
  /** Fires continuously as the wheel is dragged — even before it settles —
   * so a "month" label above it can track the day passing under the
   * center marker instead of jumping only once scrolling stops. */
  onCenterChange?: (date: string) => void;
};

const ITEM_WIDTH = 56;
// The plan reads day-by-day from today for the active ~30-day month, so the
// wheel only ever needs to span that same window — scrolling into days
// before the plan started, or past its current month, would show exercises
// that don't actually belong to whatever date is centered.
const DAYS_AHEAD = 29;

function dotColorFor(dayType: DayWheelDayType | undefined, theme: ReturnType<typeof useTheme>) {
  if (dayType === 'cardio') return theme.success;
  if (dayType === 'workout') return theme.accent;
  return theme.textTertiary;
}

/** A continuously scrollable, snap-to-day picker — like the iOS alarm-time
 * wheel, but horizontal: the centered day is emphasized, neighbors shrink
 * and fade with distance, replacing the old paginated Mon–Sun strip. */
export function DayWheel({ selectedDate, dayTypeForDate, onSelect, onCenterChange }: DayWheelProps) {
  const theme = useTheme();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const reportedIndex = useSharedValue(-1);
  const [containerWidth, setContainerWidth] = useState(0);

  const dates = useMemo(() => {
    const start = daysAgoISO(0);
    return Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => addDaysISO(start, i));
  }, []);

  const selectedIndex = dates.indexOf(selectedDate);
  const sidePadding = containerWidth > 0 ? (containerWidth - ITEM_WIDTH) / 2 : 0;

  const reportCenterIndex = useCallback(
    (rawIndex: number) => {
      const index = Math.min(Math.max(rawIndex, 0), dates.length - 1);
      onCenterChange?.(dates[index]);
    },
    [dates, onCenterChange]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const index = Math.round(event.contentOffset.x / ITEM_WIDTH);
      if (index !== reportedIndex.value) {
        reportedIndex.value = index;
        runOnJS(reportCenterIndex)(index);
      }
    },
  });

  const commitIndex = useCallback(
    (rawIndex: number) => {
      const index = Math.min(Math.max(rawIndex, 0), dates.length - 1);
      const date = dates[index];
      if (date !== selectedDate) onSelect(date);
    },
    [dates, onSelect, selectedDate]
  );

  const handleSettle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.min(
        Math.max(Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH), 0),
        dates.length - 1
      );
      // `snapToInterval` isn't reliably honored on every platform (notably
      // web), so momentum can end at an offset sitting between two days —
      // always correct it to the nearest item's exact position rather than
      // leaving the wheel resting between two numbers.
      scrollTo(scrollRef, index * ITEM_WIDTH, 0, true);
      commitIndex(index);
    },
    [commitIndex, dates.length, scrollRef]
  );

  useEffect(() => {
    if (containerWidth === 0 || selectedIndex < 0) return;
    scrollTo(scrollRef, selectedIndex * ITEM_WIDTH, 0, false);
    scrollX.value = selectedIndex * ITEM_WIDTH;
    // Re-sync only when the layout first measures or the selected date changes
    // from outside this component (e.g. a tap); our own settle already matches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth, selectedIndex]);

  return (
    <View style={styles.wrap} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      {containerWidth > 0 ? (
        <>
          <View
            pointerEvents="none"
            style={[
              styles.selectionWindow,
              { left: sidePadding, width: ITEM_WIDTH, backgroundColor: theme.accentSoft },
            ]}
          />
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onMomentumScrollEnd={handleSettle}
            onScrollEndDrag={handleSettle}
            contentContainerStyle={{ paddingHorizontal: sidePadding }}>
            {dates.map((date, index) => (
              <DayWheelItem
                key={date}
                date={date}
                index={index}
                scrollX={scrollX}
                selected={date === selectedDate}
                dayType={dayTypeForDate(date)}
                onPress={() => {
                  scrollTo(scrollRef, index * ITEM_WIDTH, 0, true);
                  commitIndex(index);
                }}
              />
            ))}
          </Animated.ScrollView>
        </>
      ) : null}
    </View>
  );
}

function DayWheelItem({
  date,
  index,
  scrollX,
  selected,
  dayType,
  onPress,
}: {
  date: string;
  index: number;
  scrollX: SharedValue<number>;
  selected: boolean;
  dayType: DayWheelDayType | undefined;
  onPress: () => void;
}) {
  const theme = useTheme();
  const today = isToday(date);

  const animatedStyle = useAnimatedStyle(() => {
    const distance = scrollX.value - index * ITEM_WIDTH;
    const range = ITEM_WIDTH * 2.5;
    const scale = interpolate(distance, [-range, 0, range], [0.78, 1, 0.78], Extrapolation.CLAMP);
    const opacity = interpolate(distance, [-range, 0, range], [0.4, 1, 0.4], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });

  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Animated.View style={[styles.itemInner, animatedStyle]}>
        <ThemedText type="caption" style={{ color: selected ? theme.accent : theme.textSecondary, fontSize: 11 }}>
          {weekdayShort(date).slice(0, 3)}
        </ThemedText>
        <ThemedText type="subtitle" style={{ color: selected ? theme.accent : theme.text }}>
          {dayOfMonth(date)}
        </ThemedText>
        <View
          style={[
            styles.dot,
            { backgroundColor: dotColorFor(dayType, theme) },
            today ? { borderWidth: 1, borderColor: theme.accent } : null,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 72,
    justifyContent: 'center',
  },
  selectionWindow: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: Radius.medium,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
});

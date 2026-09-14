import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { ProgressRing } from '@/components/ui/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { formatDayRange } from '@/lib/mock/dates';
import { Spacing } from '@/constants/theme';

export type WeeklyBurnDay = {
  label: string;
  /** ISO date, used only to build the "1-30 settembre" style period caption. */
  date: string;
  burnedKcal: number;
  eatenKcal: number;
  isToday: boolean;
  hasHappened: boolean;
  rings: { training: number; diet: number; steps: number };
};

export type WeeklyBurnChartProps = {
  days: WeeklyBurnDay[];
  burnedColor: string;
  eatenColor: string;
  /** Color of the delta bar on a surplus day (ate more than burned). */
  surplusColor: string;
  /** Color of the delta bar on a deficit day (burned more than ate). */
  deficitColor: string;
  trackColor: string;
  axisColor: string;
  todayBadgeColor: string;
  todayBadgeTextColor: string;
  trainingColor: string;
  dietColor: string;
  stepsColor: string;
  width?: number;
  /** Height of the bar-chart area only (excludes the ring-badge row, period
   * caption and legend below it). */
  height?: number;
};

// The kcal-axis label column stays fixed while the bars scroll underneath
// it, same pattern as the goal weight chart.
const GUTTER_WIDTH = 32;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 4;
const BAR_GAP = 3;
const PERIOD_LABEL_HEIGHT = 18;
// Each day needs room for 3 grouped bars plus its ring badge (40px) below —
// once "Mese"-style density isn't in play here (always 7 days), this mostly
// just keeps the 3 bars from ever feeling cramped.
const MIN_SLOT_WIDTH = 56;

type Bar = {
  colX: number;
  burnedX: number;
  eatenX: number;
  deltaX: number;
  burnedY: number;
  eatenY: number;
  deltaY: number;
  burnedH: number;
  eatenH: number;
  deltaH: number;
  barWidth: number;
  delta: number | null;
  topY: number;
};

function buildBars(days: WeeklyBurnDay[], plotWidth: number, height: number) {
  if (plotWidth <= 0 || days.length === 0) return { bars: [] as Bar[], yTicks: [] as { y: number; label: string }[] };

  const values = days.flatMap((d) => [d.burnedKcal, d.hasHappened ? d.eatenKcal : 0]);
  const max = Math.max(...values, 1);

  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const colWidth = plotWidth / days.length;
  const barWidth = Math.max(6, Math.min(11, colWidth * 0.16));

  const bars: Bar[] = days.map((day, i) => {
    const colX = i * colWidth + colWidth / 2;
    const burnedH = (day.burnedKcal / max) * plotHeight;
    const eatenH = day.hasHappened ? (day.eatenKcal / max) * plotHeight : 0;
    const delta = day.hasHappened ? day.burnedKcal - day.eatenKcal : null;
    const deltaH = delta != null ? (Math.abs(delta) / max) * plotHeight : 0;
    const groupWidth = barWidth * 3 + BAR_GAP * 2;
    const groupStart = colX - groupWidth / 2;
    return {
      colX,
      burnedX: groupStart,
      eatenX: groupStart + barWidth + BAR_GAP,
      deltaX: groupStart + (barWidth + BAR_GAP) * 2,
      burnedY: PADDING_TOP + plotHeight - burnedH,
      eatenY: PADDING_TOP + plotHeight - eatenH,
      deltaY: PADDING_TOP + plotHeight - deltaH,
      burnedH,
      eatenH,
      deltaH,
      barWidth,
      delta,
      topY: PADDING_TOP + plotHeight - Math.max(burnedH, eatenH, deltaH, 1),
    };
  });

  const yTicks = [
    { y: PADDING_TOP, label: `${Math.round(max)}` },
    { y: PADDING_TOP + plotHeight, label: '0' },
  ];

  return { bars, yTicks };
}

function slotIndexAt(x: number, count: number, colWidth: number) {
  if (count <= 0 || colWidth <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.floor(x / colWidth)));
}

/** A week-at-a-glance card: for each day, three grouped bars — estimated
 * calories burned, calories eaten, and the resulting delta (colored by
 * whether that day was a deficit or a surplus) — with a concentric-ring
 * badge below summarizing that day's training/diet/steps. Days that
 * haven't happened yet show only the (baseline) burn bar. The kcal scale
 * stays fixed on the left while the bars scroll horizontally, with a
 * scroll-synced period caption and the legend below the chart. */
export function WeeklyBurnChart({
  days,
  burnedColor,
  eatenColor,
  surplusColor,
  deficitColor,
  trackColor,
  axisColor,
  todayBadgeColor,
  todayBadgeTextColor,
  trainingColor,
  dietColor,
  stepsColor,
  width,
  height = 130,
}: WeeklyBurnChartProps) {
  const [measuredWidth, setMeasuredWidth] = useState(width ?? 0);
  const containerWidth = width ?? measuredWidth;
  const plotWidth = Math.max(containerWidth - GUTTER_WIDTH, days.length * MIN_SLOT_WIDTH);
  const colWidth = plotWidth / Math.max(days.length, 1);
  const visibleWidth = Math.max(containerWidth - GUTTER_WIDTH, 0);

  const { bars, yTicks } = buildBars(days, plotWidth, height);

  const onLayout = (e: LayoutChangeEvent) => {
    if (width == null) setMeasuredWidth(e.nativeEvent.layout.width);
  };

  const [visibleRange, setVisibleRange] = useState({ first: 0, last: 0 });
  const updateVisibleRange = (scrollX: number) => {
    setVisibleRange({
      first: slotIndexAt(scrollX, days.length, colWidth),
      last: slotIndexAt(scrollX + Math.max(visibleWidth - 1, 0), days.length, colWidth),
    });
  };

  // Whenever the set of days changes (a new week) or the visible width
  // changes (first layout), jump back to the start and recompute what's
  // actually in view rather than keeping a stale offset/caption.
  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    updateVisibleRange(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, plotWidth, visibleWidth]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => updateVisibleRange(e.nativeEvent.contentOffset.x);

  const first = days[visibleRange.first];
  const last = days[visibleRange.last];
  const periodLabel = first && last ? formatDayRange(first.date, last.date) : '';

  return (
    <View onLayout={onLayout} style={{ width: width ?? '100%' }}>
      {containerWidth > 0 ? (
        <>
          <View style={{ flexDirection: 'row' }}>
            {/* Fixed kcal-axis gutter, stays put while the bars scroll under it */}
            <View style={{ width: GUTTER_WIDTH, height }}>
              {yTicks.map((tick, i) => (
                <Text
                  key={i}
                  style={{ position: 'absolute', left: 0, width: GUTTER_WIDTH - 4, top: tick.y - 6, fontSize: 9, color: axisColor, textAlign: 'right' }}>
                  {tick.label}
                </Text>
              ))}
            </View>

            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={32}
              style={{ width: visibleWidth }}
              contentContainerStyle={{ width: plotWidth }}>
              <View style={{ width: plotWidth }}>
                <View style={{ width: plotWidth, height }}>
                  <Svg width={plotWidth} height={height}>
                    {bars.map((bar, i) => (
                      <Rect key={`burned-${i}`} x={bar.burnedX} y={bar.burnedY} width={bar.barWidth} height={Math.max(bar.burnedH, 1)} rx={2} fill={burnedColor} />
                    ))}
                    {bars.map((bar, i) =>
                      days[i].hasHappened ? (
                        <Rect key={`eaten-${i}`} x={bar.eatenX} y={bar.eatenY} width={bar.barWidth} height={Math.max(bar.eatenH, 1)} rx={2} fill={eatenColor} />
                      ) : null
                    )}
                    {bars.map((bar, i) =>
                      bar.delta != null ? (
                        <Rect
                          key={`delta-${i}`}
                          x={bar.deltaX}
                          y={bar.deltaY}
                          width={bar.barWidth}
                          height={Math.max(bar.deltaH, 1)}
                          rx={2}
                          fill={bar.delta >= 0 ? deficitColor : surplusColor}
                        />
                      ) : null
                    )}
                  </Svg>

                  {/* Value of the delta bar — the only bar that gets a
                      number, since it's the one the card is meant to draw
                      the eye to. */}
                  {bars.map((bar, i) =>
                    bar.delta != null ? (
                      <Text
                        key={i}
                        style={{
                          position: 'absolute',
                          left: bar.colX - 22,
                          width: 44,
                          top: Math.max(bar.topY - 13, 0),
                          fontSize: 9,
                          fontWeight: '700',
                          textAlign: 'center',
                          color: bar.delta >= 0 ? deficitColor : surplusColor,
                        }}>
                        {bar.delta >= 0 ? '+' : ''}
                        {Math.round(bar.delta)}
                      </Text>
                    ) : null
                  )}
                </View>

                <View style={{ flexDirection: 'row', width: plotWidth }}>
                  {days.map((day, i) => (
                    <View key={i} style={{ width: colWidth, alignItems: 'center' }}>
                      {day.isToday ? (
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: todayBadgeColor,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: Spacing.one,
                          }}>
                          <ThemedText type="caption" style={{ color: todayBadgeTextColor, fontWeight: '700', fontSize: 11 }}>
                            {day.label}
                          </ThemedText>
                        </View>
                      ) : (
                        <ThemedText type="caption" themeColor="textSecondary" style={{ marginBottom: Spacing.one }}>
                          {day.label}
                        </ThemedText>
                      )}
                      <ProgressRing size={40} strokeWidth={4} progress={day.rings.training} color={trainingColor} trackColor={trackColor}>
                        <ProgressRing size={29} strokeWidth={3} progress={day.rings.diet} color={dietColor} trackColor={trackColor}>
                          <ProgressRing size={18} strokeWidth={2.5} progress={day.rings.steps} color={stepsColor} trackColor={trackColor} />
                        </ProgressRing>
                      </ProgressRing>
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* Period caption — tracks whichever days are currently scrolled
              into view, e.g. "14-19 settembre". */}
          <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: '600', color: axisColor, height: PERIOD_LABEL_HEIGHT, marginTop: Spacing.one }}>
            {periodLabel}
          </Text>

          {/* Legend, below the period caption */}
          <View style={styles.legendRow}>
            <LegendItem color={burnedColor} label="Bruciate" />
            <LegendItem color={eatenColor} label="Assunte" />
            <LegendItem color={deficitColor} label="Deficit" />
            <LegendItem color={surplusColor} label="Surplus" />
          </View>
        </>
      ) : null}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = {
  legendRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    columnGap: Spacing.two,
    rowGap: Spacing.one,
    marginTop: Spacing.one,
  },
  legendItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
};

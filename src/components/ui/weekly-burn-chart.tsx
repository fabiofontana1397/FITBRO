import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { ProgressRing } from '@/components/ui/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { formatDayRange } from '@/lib/mock/dates';
import { Spacing } from '@/constants/theme';

export type WeeklyBurnDay = {
  label: string;
  /** ISO date, used only to build the "14-20 settembre" style period caption. */
  date: string;
  burnedKcal: number;
  eatenKcal: number;
  isToday: boolean;
  hasHappened: boolean;
  rings: { training: number; diet: number; steps: number };
};

export type WeeklyBurnChartProps = {
  days: WeeklyBurnDay[];
  /** Bar color on a surplus day (ate more than burned). */
  surplusColor: string;
  /** Bar color on a deficit day (burned more than ate). */
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

// Kept narrow now that it only has to fit a handful of kcal digits, so the
// ring-badge row below gets as much of the card's width as possible —
// otherwise the 40px rings would overlap in a 7-column, no-scroll week.
const GUTTER_WIDTH = 24;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 4;
const PERIOD_LABEL_HEIGHT = 18;
const RING_SIZE = 36;

type Bar = {
  colX: number;
  barX: number;
  barY: number;
  barH: number;
  barWidth: number;
  delta: number | null;
  topY: number;
};

function buildBars(days: WeeklyBurnDay[], plotWidth: number, height: number) {
  if (plotWidth <= 0 || days.length === 0) return { bars: [] as Bar[], yTicks: [] as { y: number; label: string }[] };

  const deltas = days.map((d) => (d.hasHappened ? d.burnedKcal - d.eatenKcal : null));
  const max = Math.max(...deltas.filter((d): d is number => d != null).map((d) => Math.abs(d)), 1);

  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const colWidth = plotWidth / days.length;
  const barWidth = Math.max(10, Math.min(22, colWidth * 0.5));

  const bars: Bar[] = days.map((day, i) => {
    const colX = i * colWidth + colWidth / 2;
    const delta = deltas[i];
    const barH = delta != null ? (Math.abs(delta) / max) * plotHeight : 0;
    const barY = PADDING_TOP + plotHeight - barH;
    return {
      colX,
      barX: colX - barWidth / 2,
      barY,
      barH,
      barWidth,
      delta,
      topY: PADDING_TOP + plotHeight - Math.max(barH, 1),
    };
  });

  const yTicks = [
    { y: PADDING_TOP, label: `${Math.round(max)}` },
    { y: PADDING_TOP + plotHeight, label: '0' },
  ];

  return { bars, yTicks };
}

/** A week-at-a-glance card, always showing Monday-Sunday of the current
 * week (no scrolling): one bar per day for that day's calorie
 * deficit/surplus (fuchsia/blue), labeled with its kcal value, with a
 * concentric-ring badge below each day summarizing that day's
 * training/diet/steps. Days that haven't happened yet show no bar. */
export function WeeklyBurnChart({
  days,
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
  const plotWidth = Math.max(containerWidth - GUTTER_WIDTH, 0);
  const colWidth = plotWidth / Math.max(days.length, 1);

  const { bars, yTicks } = buildBars(days, plotWidth, height);

  const onLayout = (e: LayoutChangeEvent) => {
    if (width == null) setMeasuredWidth(e.nativeEvent.layout.width);
  };

  const periodLabel = days.length > 0 ? formatDayRange(days[0].date, days[days.length - 1].date) : '';

  return (
    <View onLayout={onLayout} style={{ width: width ?? '100%' }}>
      {containerWidth > 0 ? (
        <>
          <View style={{ flexDirection: 'row' }}>
            {/* Fixed kcal-axis gutter */}
            <View style={{ width: GUTTER_WIDTH, height }}>
              {yTicks.map((tick, i) => (
                <Text
                  key={i}
                  style={{ position: 'absolute', left: 0, width: GUTTER_WIDTH - 4, top: tick.y - 6, fontSize: 9, color: axisColor, textAlign: 'right' }}>
                  {tick.label}
                </Text>
              ))}
            </View>

            <View style={{ width: plotWidth }}>
              <View style={{ width: plotWidth, height }}>
                <Svg width={plotWidth} height={height}>
                  {bars.map((bar, i) =>
                    bar.delta != null ? (
                      <Rect
                        key={`bar-${i}`}
                        x={bar.barX}
                        y={bar.barY}
                        width={bar.barWidth}
                        height={Math.max(bar.barH, 1)}
                        rx={3}
                        fill={bar.delta >= 0 ? deficitColor : surplusColor}
                      />
                    ) : null
                  )}
                </Svg>

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
                    <ProgressRing size={RING_SIZE} strokeWidth={4} progress={day.rings.training} color={trainingColor} trackColor={trackColor}>
                      <ProgressRing size={RING_SIZE - 10} strokeWidth={3} progress={day.rings.diet} color={dietColor} trackColor={trackColor}>
                        <ProgressRing size={RING_SIZE - 19} strokeWidth={2.5} progress={day.rings.steps} color={stepsColor} trackColor={trackColor} />
                      </ProgressRing>
                    </ProgressRing>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Period caption — the current week's fixed Monday-Sunday range,
              e.g. "14-20 settembre". */}
          <Text style={{ textAlign: 'center', fontSize: 11, fontWeight: '600', color: axisColor, height: PERIOD_LABEL_HEIGHT, marginTop: Spacing.one }}>
            {periodLabel}
          </Text>

          {/* Legend, below the period caption */}
          <View style={styles.legendRow}>
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

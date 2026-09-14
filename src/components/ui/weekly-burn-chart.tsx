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
  burnedColor: string;
  eatenColor: string;
  /** Color of the delta cap on a surplus day (ate more than burned). */
  surplusColor: string;
  /** Color of the delta cap on a deficit day (burned more than ate). */
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

const GUTTER_WIDTH = 32;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 4;
const BAR_GAP = 3;
const PERIOD_LABEL_HEIGHT = 18;

type Bar = {
  colX: number;
  burnedX: number;
  eatenX: number;
  burnedY: number;
  eatenY: number;
  burnedH: number;
  eatenH: number;
  barWidth: number;
  delta: number | null;
  /** The delta cap: an extension of whichever bar (burned or eaten) is
   * shorter, reaching up to match the taller one — deficit caps the eaten
   * bar, surplus caps the burned bar. Null once delta is 0/negligible. */
  deltaCap: { x: number; y: number; h: number } | null;
  topY: number;
};

function buildBars(days: WeeklyBurnDay[], plotWidth: number, height: number) {
  if (plotWidth <= 0 || days.length === 0) return { bars: [] as Bar[], yTicks: [] as { y: number; label: string }[] };

  const values = days.flatMap((d) => [d.burnedKcal, d.hasHappened ? d.eatenKcal : 0]);
  const max = Math.max(...values, 1);

  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const colWidth = plotWidth / days.length;
  const barWidth = Math.max(6, Math.min(14, colWidth * 0.3));

  const bars: Bar[] = days.map((day, i) => {
    const colX = i * colWidth + colWidth / 2;
    const burnedH = (day.burnedKcal / max) * plotHeight;
    const eatenH = day.hasHappened ? (day.eatenKcal / max) * plotHeight : 0;
    const delta = day.hasHappened ? day.burnedKcal - day.eatenKcal : null;

    const burnedX = colX - barWidth - BAR_GAP / 2;
    const eatenX = colX + BAR_GAP / 2;
    const burnedY = PADDING_TOP + plotHeight - burnedH;
    const eatenY = PADDING_TOP + plotHeight - eatenH;

    let deltaCap: Bar['deltaCap'] = null;
    if (delta != null && Math.abs(delta) > 0.5) {
      deltaCap =
        delta >= 0
          ? { x: eatenX, y: burnedY, h: eatenY - burnedY } // deficit: caps the (shorter) eaten bar up to the burned bar's height
          : { x: burnedX, y: eatenY, h: burnedY - eatenY }; // surplus: caps the (shorter) burned bar up to the eaten bar's height
    }

    return {
      colX,
      burnedX,
      eatenX,
      burnedY,
      eatenY,
      burnedH,
      eatenH,
      barWidth,
      delta,
      deltaCap,
      topY: PADDING_TOP + plotHeight - Math.max(burnedH, eatenH, 1),
    };
  });

  const yTicks = [
    { y: PADDING_TOP, label: `${Math.round(max)}` },
    { y: PADDING_TOP + plotHeight, label: '0' },
  ];

  return { bars, yTicks };
}

/** A week-at-a-glance card, always showing Monday-Sunday of the current
 * week (no scrolling): burned/eaten bars per day, with the resulting
 * delta drawn as a colored cap stacked on top of whichever of the two is
 * shorter — capping the eaten bar (deficit color) when it was a deficit
 * day, or the burned bar (surplus color) when it was a surplus — labeled
 * with its kcal value. A concentric-ring badge below each day summarizes
 * that day's training/diet/steps. Days that haven't happened yet show
 * only the (baseline) burn bar. */
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
                  {bars.map((bar, i) => (
                    <Rect key={`burned-${i}`} x={bar.burnedX} y={bar.burnedY} width={bar.barWidth} height={Math.max(bar.burnedH, 1)} rx={2} fill={burnedColor} />
                  ))}
                  {bars.map((bar, i) =>
                    days[i].hasHappened ? (
                      <Rect key={`eaten-${i}`} x={bar.eatenX} y={bar.eatenY} width={bar.barWidth} height={Math.max(bar.eatenH, 1)} rx={2} fill={eatenColor} />
                    ) : null
                  )}
                  {bars.map((bar, i) =>
                    bar.deltaCap ? (
                      <Rect
                        key={`delta-${i}`}
                        x={bar.deltaCap.x}
                        y={bar.deltaCap.y}
                        width={bar.barWidth}
                        height={bar.deltaCap.h}
                        rx={2}
                        fill={(bar.delta ?? 0) >= 0 ? deficitColor : surplusColor}
                      />
                    ) : null
                  )}
                </Svg>

                {/* Value of the delta cap — the only bar that gets a
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
          </View>

          {/* Period caption — the current week's fixed Monday-Sunday range,
              e.g. "14-20 settembre". */}
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

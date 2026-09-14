import { useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { ProgressRing } from '@/components/ui/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type WeeklyBurnDay = {
  label: string;
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
  deficitColor: string;
  surplusColor: string;
  trackColor: string;
  axisColor: string;
  todayBadgeColor: string;
  todayBadgeTextColor: string;
  trainingColor: string;
  dietColor: string;
  stepsColor: string;
  width?: number;
  height?: number;
};

const PADDING_LEFT = 30;
const PADDING_RIGHT = 6;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 4;
const BAR_GAP = 3;

function buildBars(days: WeeklyBurnDay[], width: number, height: number) {
  if (width <= 0 || days.length === 0) return { bars: [], yTicks: [] as { y: number; label: string }[] };

  const values = days.flatMap((d) => [d.burnedKcal, d.hasHappened ? d.eatenKcal : 0]);
  const max = Math.max(...values, 1);

  const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const colWidth = plotWidth / days.length;
  const barWidth = Math.max(6, Math.min(14, colWidth * 0.3));

  const bars = days.map((day, i) => {
    const colX = PADDING_LEFT + i * colWidth + colWidth / 2;
    const burnedH = (day.burnedKcal / max) * plotHeight;
    const eatenH = day.hasHappened ? (day.eatenKcal / max) * plotHeight : 0;
    const delta = day.hasHappened ? day.burnedKcal - day.eatenKcal : null;
    return {
      colX,
      burnedX: colX - barWidth - BAR_GAP / 2,
      eatenX: colX + BAR_GAP / 2,
      burnedY: PADDING_TOP + plotHeight - burnedH,
      eatenY: PADDING_TOP + plotHeight - eatenH,
      burnedH,
      eatenH,
      barWidth,
      delta,
      topY: PADDING_TOP + plotHeight - Math.max(burnedH, eatenH, 1),
    };
  });

  const yTicks = [
    { y: PADDING_TOP, label: `${Math.round(max)}` },
    { y: PADDING_TOP + plotHeight, label: '0' },
  ];

  return { bars, yTicks };
}

/** A week-at-a-glance card: paired bars of estimated calories burned
 * (basal metabolism plus a bump on days a planned workout was actually
 * completed) versus calories actually eaten, with the resulting daily
 * deficit/surplus called out above each day in color — and below it one
 * small concentric-ring badge per weekday summarizing that day's
 * training/diet/steps. Days that haven't happened yet show only the
 * (baseline) burn bar, no eaten bar and no delta, rather than a fake 0. */
export function WeeklyBurnChart({
  days,
  burnedColor,
  eatenColor,
  deficitColor,
  surplusColor,
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
  const chartWidth = width ?? measuredWidth;

  const { bars, yTicks } = useMemo(() => buildBars(days, chartWidth, height), [days, chartWidth, height]);

  const onLayout = (e: LayoutChangeEvent) => {
    if (width == null) setMeasuredWidth(e.nativeEvent.layout.width);
  };

  return (
    <View onLayout={onLayout} style={{ width: width ?? '100%' }}>
      <View style={{ width: chartWidth > 0 ? chartWidth : '100%', height }}>
        {chartWidth > 0 ? (
          <>
            <Svg width={chartWidth} height={height}>
              {bars.map((bar, i) => (
                <Rect
                  key={`burned-${i}`}
                  x={bar.burnedX}
                  y={bar.burnedY}
                  width={bar.barWidth}
                  height={Math.max(bar.burnedH, 1)}
                  rx={2}
                  fill={burnedColor}
                />
              ))}
              {bars.map((bar, i) =>
                days[i].hasHappened ? (
                  <Rect key={`eaten-${i}`} x={bar.eatenX} y={bar.eatenY} width={bar.barWidth} height={Math.max(bar.eatenH, 1)} rx={2} fill={eatenColor} />
                ) : null
              )}
            </Svg>

            {/* Y-axis value labels — plain RN Text, not SVG <Text>, for
                reliable cross-platform rendering. */}
            {yTicks.map((tick, i) => (
              <Text
                key={i}
                style={{ position: 'absolute', left: 0, width: PADDING_LEFT - 4, top: tick.y - 6, fontSize: 9, color: axisColor, textAlign: 'right' }}>
                {tick.label}
              </Text>
            ))}

            {/* Daily deficit/surplus, called out above each day's bars. */}
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
          </>
        ) : null}
      </View>

      {chartWidth > 0 ? (
        <View style={{ flexDirection: 'row', width: chartWidth }}>
          {days.map((day, i) => (
            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
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
      ) : null}
    </View>
  );
}

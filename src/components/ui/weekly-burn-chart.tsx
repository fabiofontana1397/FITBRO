import { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { ProgressRing } from '@/components/ui/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type WeeklyBurnDay = {
  label: string;
  burnedKcal: number;
  isToday: boolean;
  hasHappened: boolean;
  rings: { training: number; diet: number; steps: number };
};

export type WeeklyBurnChartProps = {
  days: WeeklyBurnDay[];
  color: string;
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

const PADDING_LEFT = 34;
const PADDING_RIGHT = 10;
const PADDING_TOP = 14;
const PADDING_BOTTOM = 4;

function buildLine(days: WeeklyBurnDay[], width: number, height: number) {
  const empty = { solidPath: '', area: '', dashedPath: '', lastPoint: undefined, yTicks: [] as { y: number; label: string }[] };
  if (days.length < 2 || width <= 0) return empty;

  // Every day already has an estimated burn (today/past from real data, days
  // ahead from baseline BMR alone) — the chart always has something to draw
  // even right after the week starts, rather than staying blank until
  // several days have actually happened.
  const values = days.map((d) => d.burnedKcal);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const stepX = plotWidth / (days.length - 1);

  const toY = (value: number) => PADDING_TOP + plotHeight * (1 - (value - min) / range);
  const allPoints = days.map((d, i) => ({ x: PADDING_LEFT + i * stepX, y: toY(d.burnedKcal) }));

  let lastKnownIndex = -1;
  days.forEach((d, i) => {
    if (d.hasHappened) lastKnownIndex = i;
  });

  const solidPoints = allPoints.slice(0, lastKnownIndex + 1);
  // Starts at the last real day so the dashed line picks up exactly where
  // the solid one ends, same as the goal-weight chart's projection.
  const dashedPoints = allPoints.slice(Math.max(lastKnownIndex, 0));

  const toPath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

  const solidPath = solidPoints.length >= 2 ? toPath(solidPoints) : '';
  const area = solidPath
    ? `${solidPath} L ${solidPoints[solidPoints.length - 1].x.toFixed(2)} ${height} L ${solidPoints[0].x.toFixed(2)} ${height} Z`
    : '';
  const dashedPath = dashedPoints.length >= 2 ? toPath(dashedPoints) : '';

  const yTicks = [
    { y: toY(max), label: `${Math.round(max)}` },
    { y: toY(min), label: `${Math.round(min)}` },
  ];

  return { solidPath, area, dashedPath, lastPoint: lastKnownIndex >= 0 ? allPoints[lastKnownIndex] : undefined, yTicks };
}

/** A week-at-a-glance card: a trend line of estimated daily calories
 * burned (basal metabolism plus a bump on days a planned workout was
 * actually completed) — solid through today, dashed for the rest of the
 * week (baseline burn only, no workout bump yet) so the chart never sits
 * empty right after the week starts — and below it one small concentric-
 * ring badge per weekday summarizing that day's training/diet/steps; days
 * that haven't happened yet simply read as empty rings rather than a fake
 * plan hitting 0%. */
export function WeeklyBurnChart({
  days,
  color,
  trackColor,
  axisColor,
  todayBadgeColor,
  todayBadgeTextColor,
  trainingColor,
  dietColor,
  stepsColor,
  width,
  height = 120,
}: WeeklyBurnChartProps) {
  const [measuredWidth, setMeasuredWidth] = useState(width ?? 0);
  const chartWidth = width ?? measuredWidth;

  const { solidPath, area, dashedPath, lastPoint, yTicks } = useMemo(() => buildLine(days, chartWidth, height), [days, chartWidth, height]);

  const onLayout = (e: LayoutChangeEvent) => {
    if (width == null) setMeasuredWidth(e.nativeEvent.layout.width);
  };

  return (
    <View onLayout={onLayout} style={{ width: width ?? '100%' }}>
      <View style={{ width: chartWidth > 0 ? chartWidth : '100%', height }}>
        {chartWidth > 0 ? (
          <Svg width={chartWidth} height={height}>
            <Defs>
              <LinearGradient id="weeklyBurnFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.28} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {yTicks.map((tick, i) => (
              <SvgText key={i} x={PADDING_LEFT - 6} y={tick.y + 4} fontSize={10} fill={axisColor} textAnchor="end">
                {tick.label}
              </SvgText>
            ))}
            {area ? <Path d={area} fill="url(#weeklyBurnFill)" /> : null}
            {dashedPath ? (
              <Path d={dashedPath} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 5" />
            ) : null}
            {solidPath ? (
              <Path d={solidPath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            {lastPoint ? <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} /> : null}
          </Svg>
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

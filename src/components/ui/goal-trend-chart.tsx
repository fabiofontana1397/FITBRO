import { useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { formatDayMonth } from '@/lib/mock/dates';

export type WeightPoint = { date: string; value: number };

export type GoalTrendChartProps = {
  /** Actual logged weigh-ins so far, chronological. */
  history: WeightPoint[];
  /** A guide toward the target given the diet plan's calorie deficit/
   * surplus, one point per month (the weight the plan implies by the end
   * of that month) — empty when there isn't enough info to project. Its
   * first point should be the same as history's last point, so the
   * dashed line continues seamlessly from the solid one. */
  projection: WeightPoint[];
  target: number;
  width?: number;
  height?: number;
  color: string;
  projectionColor: string;
  targetColor: string;
  axisColor: string;
};

const PADDING_LEFT = 42;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 24;

function buildChart(history: WeightPoint[], projection: WeightPoint[], target: number, width: number, height: number) {
  const empty = {
    historyPath: '',
    historyArea: '',
    projectionPath: '',
    lastPoint: undefined as { x: number; y: number } | undefined,
    targetY: height / 2,
    milestone: undefined as { x: number; y: number; date: string } | undefined,
    xTicks: [] as { x: number; label: string; anchor: 'start' | 'middle' | 'end' }[],
    yTicks: [] as { y: number; label: string }[],
  };
  if (history.length < 2 || width <= 0) return empty;

  const allPoints = [...history, ...projection];
  const values = [...allPoints.map((p) => p.value), target];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const valueRange = max - min || 1;

  const times = allPoints.map((p) => new Date(p.date).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeRange = maxTime - minTime || 1;

  const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const toX = (date: string) => PADDING_LEFT + ((new Date(date).getTime() - minTime) / timeRange) * plotWidth;
  const toY = (value: number) => PADDING_TOP + plotHeight * (1 - (value - min) / valueRange);

  const historyXY = history.map((p) => ({ x: toX(p.date), y: toY(p.value) }));
  const projectionXY = projection.map((p) => ({ x: toX(p.date), y: toY(p.value) }));

  const historyPath = historyXY.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const historyArea = historyPath
    ? `${historyPath} L ${historyXY[historyXY.length - 1].x.toFixed(2)} ${PADDING_TOP + plotHeight} L ${historyXY[0].x.toFixed(2)} ${PADDING_TOP + plotHeight} Z`
    : '';
  const projectionPath = projectionXY.length
    ? projectionXY.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')
    : '';

  const lastPoint = historyXY[historyXY.length - 1];

  // The point (if any) where the projection actually lands on the target —
  // rendered as its own milestone marker, distinct from the plain trend.
  const milestoneIndex = projection.findIndex((p) => Math.abs(p.value - target) < 0.05);
  const milestone = milestoneIndex >= 0 ? { ...projectionXY[milestoneIndex], date: projection[milestoneIndex].date } : undefined;

  const xTicks: { x: number; label: string; anchor: 'start' | 'middle' | 'end' }[] = [
    { x: PADDING_LEFT, label: formatDayMonth(history[0].date), anchor: 'start' },
    { x: lastPoint.x, label: 'Oggi', anchor: 'middle' },
    ...(projection.length
      ? [{ x: toX(projection[projection.length - 1].date), label: formatDayMonth(projection[projection.length - 1].date), anchor: 'end' as const }]
      : []),
  ];

  const yTicks = [
    { y: toY(max), label: `${max.toFixed(1)}` },
    { y: toY(min), label: `${min.toFixed(1)}` },
  ];

  return { historyPath, historyArea, projectionPath, lastPoint, targetY: toY(target), milestone, xTicks, yTicks };
}

/** A weight trend chart that updates as new entries are logged: the solid
 * line is the actual history, the dashed line is a guide toward the
 * target — one point per month, at the weight the diet plan's calorie
 * target for that month implies — and the target itself is always
 * marked, both as a reference line and, once the guide reaches it, as its
 * own milestone point. Axis value labels are plain React Native Text
 * absolutely positioned over the SVG rather than SVG <Text> — the latter's
 * baseline handling isn't consistent enough across web/iOS/Android to
 * trust for something this small. */
export function GoalTrendChart({
  history,
  projection,
  target,
  width,
  height = 168,
  color,
  projectionColor,
  targetColor,
  axisColor,
}: GoalTrendChartProps) {
  const [measuredWidth, setMeasuredWidth] = useState(width ?? 0);
  const chartWidth = width ?? measuredWidth;

  const { historyPath, historyArea, projectionPath, lastPoint, targetY, milestone, xTicks, yTicks } = useMemo(
    () => buildChart(history, projection, target, chartWidth, height),
    [history, projection, target, chartWidth, height]
  );

  const onLayout = (e: LayoutChangeEvent) => {
    if (width == null) setMeasuredWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={{ width: width ?? '100%', height }} onLayout={onLayout}>
      {chartWidth > 0 ? (
        <View style={{ width: chartWidth, height }}>
          <Svg width={chartWidth} height={height}>
            <Defs>
              <LinearGradient id="goalTrendFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.28} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Axes */}
            <Line x1={PADDING_LEFT} y1={PADDING_TOP} x2={PADDING_LEFT} y2={height - PADDING_BOTTOM} stroke={axisColor} strokeWidth={1} />
            <Line
              x1={PADDING_LEFT}
              y1={height - PADDING_BOTTOM}
              x2={chartWidth - PADDING_RIGHT}
              y2={height - PADDING_BOTTOM}
              stroke={axisColor}
              strokeWidth={1}
            />

            {/* Target reference line */}
            <Line
              x1={PADDING_LEFT}
              y1={targetY}
              x2={chartWidth - PADDING_RIGHT}
              y2={targetY}
              stroke={targetColor}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />

            {historyArea ? <Path d={historyArea} fill="url(#goalTrendFill)" /> : null}
            {historyPath ? (
              <Path d={historyPath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            {projectionPath ? (
              <Path
                d={projectionPath}
                stroke={projectionColor}
                strokeWidth={2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6 5"
              />
            ) : null}

            {lastPoint ? <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} /> : null}
            {milestone ? (
              <>
                <Circle cx={milestone.x} cy={milestone.y} r={6} fill="none" stroke={targetColor} strokeWidth={2} />
                <Circle cx={milestone.x} cy={milestone.y} r={3} fill={targetColor} />
              </>
            ) : null}
          </Svg>

          {/* Target label */}
          <Text
            style={{
              position: 'absolute',
              right: PADDING_RIGHT,
              top: Math.max(targetY - 16, 0),
              fontSize: 10,
              fontWeight: '700',
              color: targetColor,
            }}>
            Obiettivo {target}kg
          </Text>

          {/* Y-axis value labels */}
          {yTicks.map((tick, i) => (
            <Text
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                width: PADDING_LEFT - 6,
                top: tick.y - 7,
                fontSize: 10,
                color: axisColor,
                textAlign: 'right',
              }}>
              {tick.label}
            </Text>
          ))}

          {/* X-axis date labels */}
          {xTicks.map((tick, i) => {
            const boxWidth = 70;
            const left = tick.anchor === 'start' ? tick.x : tick.anchor === 'end' ? tick.x - boxWidth : tick.x - boxWidth / 2;
            const textAlign = tick.anchor === 'start' ? 'left' : tick.anchor === 'end' ? 'right' : 'center';
            return (
              <Text
                key={i}
                style={{
                  position: 'absolute',
                  left,
                  width: boxWidth,
                  top: height - PADDING_BOTTOM + 6,
                  fontSize: 10,
                  color: axisColor,
                  textAlign,
                }}>
                {tick.label}
              </Text>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

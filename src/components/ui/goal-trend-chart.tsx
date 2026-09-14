import { useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

export type WeightPoint = { date: string; value: number; xLabel: string };

export type GoalTrendChartProps = {
  /** Chronological points for whichever range is currently selected
   * (day/week/year) — already aggregated/labeled by the caller. */
  points: WeightPoint[];
  target: number;
  width?: number;
  height?: number;
  color: string;
  targetColor: string;
  axisColor: string;
  gridColor: string;
};

const PADDING_LEFT = 38;
const PADDING_RIGHT = 12;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 22;
const Y_TICK_COUNT = 4;

function buildChart(points: WeightPoint[], target: number, width: number, height: number) {
  const empty = {
    path: '',
    area: '',
    xy: [] as { x: number; y: number; value: number }[],
    targetY: height / 2,
    xTicks: [] as { x: number; label: string }[],
    yTicks: [] as { y: number; label: string }[],
  };
  if (points.length < 2 || width <= 0) return empty;

  const rawValues = [...points.map((p) => p.value), target];
  const rawMin = Math.min(...rawValues);
  const rawMax = Math.max(...rawValues);
  // A little headroom above/below so dots and their value labels near the
  // extremes never sit flush against the plot edge.
  const pad = (rawMax - rawMin) * 0.15 || 1;
  const min = rawMin - pad;
  const max = rawMax + pad;
  const valueRange = max - min || 1;

  const plotWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;

  // Points are evenly spaced by index rather than by actual elapsed time:
  // real-world weigh-ins are logged irregularly (daily near "oggi", sparser
  // further back), and a time-proportional axis would bunch closely-logged
  // points together and collide their labels. Each point already represents
  // one category slot (a day/week/month), so a categorical axis reads better.
  const toX = (i: number) => (points.length === 1 ? PADDING_LEFT + plotWidth / 2 : PADDING_LEFT + (i / (points.length - 1)) * plotWidth);
  const toY = (value: number) => PADDING_TOP + plotHeight * (1 - (value - min) / valueRange);

  const xy = points.map((p, i) => ({ x: toX(i), y: toY(p.value), value: p.value }));
  const path = xy.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const area = `${path} L ${xy[xy.length - 1].x.toFixed(2)} ${height} L ${xy[0].x.toFixed(2)} ${height} Z`;

  const xTicks = points.map((p, i) => ({ x: xy[i].x, label: p.xLabel }));
  const yTicks = Array.from({ length: Y_TICK_COUNT }, (_, i) => {
    const value = min + (valueRange * i) / (Y_TICK_COUNT - 1);
    return { y: toY(value), label: value.toFixed(1) };
  }).reverse();

  return { path, area, xy, targetY: toY(target), xTicks, yTicks };
}

/** A weight trend chart matching the familiar Health-app look: horizontal
 * gridlines with value labels, vertical dashed gridlines per x tick, a
 * solid trend line with a value label at every dot (not just the last),
 * and the target as its own reference line. Axis/value labels are plain
 * React Native Text absolutely positioned over the SVG rather than SVG
 * <Text> — the latter's baseline handling isn't consistent enough across
 * web/iOS/Android to trust for something this small. */
export function GoalTrendChart({ points, target, width, height = 240, color, targetColor, axisColor, gridColor }: GoalTrendChartProps) {
  const [measuredWidth, setMeasuredWidth] = useState(width ?? 0);
  const chartWidth = width ?? measuredWidth;

  const { path, area, xy, targetY, xTicks, yTicks } = useMemo(() => buildChart(points, target, chartWidth, height), [points, target, chartWidth, height]);

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

            {/* Horizontal gridlines */}
            {yTicks.map((tick, i) => (
              <Line key={`y${i}`} x1={PADDING_LEFT} y1={tick.y} x2={chartWidth - PADDING_RIGHT} y2={tick.y} stroke={gridColor} strokeWidth={1} />
            ))}
            {/* Vertical dashed gridlines, one per point */}
            {xTicks.map((tick, i) => (
              <Line
                key={`x${i}`}
                x1={tick.x}
                y1={PADDING_TOP}
                x2={tick.x}
                y2={height - PADDING_BOTTOM}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray="2 4"
              />
            ))}

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

            {area ? <Path d={area} fill="url(#goalTrendFill)" /> : null}
            {path ? <Path d={path} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {xy.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={i === xy.length - 1 ? 4.5 : 3} fill={color} />
            ))}
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

          {/* X-axis labels */}
          {xTicks.map((tick, i) => (
            <Text
              key={i}
              style={{
                position: 'absolute',
                left: tick.x - 20,
                width: 40,
                top: height - PADDING_BOTTOM + 6,
                fontSize: 9,
                color: axisColor,
                textAlign: 'center',
              }}>
              {tick.label}
            </Text>
          ))}

          {/* Per-dot kg value, so every logged/aggregated point reads its
              own progress rather than needing to eyeball the y-axis. */}
          {xy.map((p, i) => (
            <Text
              key={i}
              style={{
                position: 'absolute',
                left: p.x - 20,
                width: 40,
                top: p.y - 20,
                fontSize: 9,
                fontWeight: '700',
                textAlign: 'center',
                color,
              }}>
              {p.value.toFixed(1)}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

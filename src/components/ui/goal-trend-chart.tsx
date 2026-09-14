import { useMemo, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

export type GoalTrendChartProps = {
  /** Chronological actual values (e.g. logged weight-ins). */
  data: number[];
  /** Where the user wants to end up — rendered as a dashed reference line. */
  target: number;
  /** Fixed width; omit to fill whatever width the parent gives it. */
  width?: number;
  height?: number;
  color: string;
  targetColor: string;
};

function buildPaths(data: number[], target: number, width: number, height: number, padding = 8) {
  if (data.length < 2 || width <= 0) return { line: '', area: '', lastPoint: undefined, targetY: height / 2 };

  // The target is folded into the min/max alongside the actual data so its
  // dashed line always lands inside the chart — even a target well below
  // (or above) every logged value stays visible instead of clipping off.
  const allValues = [...data, target];
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (data.length - 1);
  const toY = (value: number) => padding + (height - padding * 2) * (1 - (value - min) / range);

  const points = data.map((value, index) => ({ x: padding + index * stepX, y: toY(value) }));

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const area = `${line} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`;

  return { line, area, lastPoint: points[points.length - 1], targetY: toY(target) };
}

/** A weight-style trend line that updates as new entries are logged, with
 * a dashed reference line marking the goal so progress toward it is
 * always visible at a glance — not just the current number. Fills the
 * parent's width by default (measured via onLayout) rather than needing a
 * hardcoded size, since it's meant to stretch across a card. */
export function GoalTrendChart({ data, target, width, height = 96, color, targetColor }: GoalTrendChartProps) {
  const [measuredWidth, setMeasuredWidth] = useState(width ?? 0);
  const chartWidth = width ?? measuredWidth;

  const { line, area, lastPoint, targetY } = useMemo(
    () => buildPaths(data, target, chartWidth, height),
    [data, target, chartWidth, height]
  );

  const onLayout = (e: LayoutChangeEvent) => {
    if (width == null) setMeasuredWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={{ width: width ?? '100%', height }} onLayout={onLayout}>
      {chartWidth > 0 ? (
        <Svg width={chartWidth} height={height}>
          <Defs>
            <LinearGradient id="goalTrendFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.28} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Line x1={0} y1={targetY} x2={chartWidth} y2={targetY} stroke={targetColor} strokeWidth={1.5} strokeDasharray="5 5" />
          {area ? <Path d={area} fill="url(#goalTrendFill)" /> : null}
          {line ? <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {lastPoint ? <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} /> : null}
        </Svg>
      ) : null}
    </View>
  );
}

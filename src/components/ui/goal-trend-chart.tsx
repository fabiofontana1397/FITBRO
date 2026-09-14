import { useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

export type WeightPoint = { date: string; value: number };

export type GoalTrendChartProps = {
  /** Actual logged weigh-ins so far, chronological. */
  history: WeightPoint[];
  /** The plan's own intended trajectory — one point per month of the full
   * plan (same count as the training/nutrition plan's duration), anchored
   * at the plan's start rather than "today", so it reads as a fixed
   * roadmap to compare real progress against rather than a forecast that
   * keeps sliding as today moves. Rendered as grey milestone dots. */
  guide: WeightPoint[];
  target: number;
  width?: number;
  height?: number;
  color: string;
  guideColor: string;
  targetColor: string;
  axisColor: string;
};

const PADDING_LEFT = 42;
const PADDING_RIGHT = 12;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 24;

const monthShort = (date: string) => {
  const label = new Date(date).toLocaleDateString('it-IT', { month: 'short' });
  return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '');
};

function buildChart(history: WeightPoint[], guide: WeightPoint[], target: number, width: number, height: number) {
  const empty = {
    historyPath: '',
    historyArea: '',
    guidePath: '',
    historyXY: [] as { x: number; y: number }[],
    guideXY: [] as { x: number; y: number; date: string; value: number }[],
    todayX: undefined as number | undefined,
    targetY: height / 2,
    xTicks: [] as { x: number; label: string }[],
    yTicks: [] as { y: number; label: string }[],
  };
  if (history.length < 2 || width <= 0) return empty;

  const allPoints = [...history, ...guide];
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
  const guideXY = guide.map((p) => ({ x: toX(p.date), y: toY(p.value), date: p.date, value: p.value }));

  const historyPath = historyXY.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const historyArea = historyPath
    ? `${historyPath} L ${historyXY[historyXY.length - 1].x.toFixed(2)} ${PADDING_TOP + plotHeight} L ${historyXY[0].x.toFixed(2)} ${PADDING_TOP + plotHeight} Z`
    : '';
  const guidePath = guideXY.length >= 2 ? guideXY.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') : '';

  const xTicks = guide.map((p) => ({ x: toX(p.date), label: monthShort(p.date) }));

  const yTicks = [
    { y: toY(max), label: `${max.toFixed(1)}` },
    { y: toY(min), label: `${min.toFixed(1)}` },
  ];

  return {
    historyPath,
    historyArea,
    guidePath,
    historyXY,
    guideXY,
    todayX: historyXY[historyXY.length - 1]?.x,
    targetY: toY(target),
    xTicks,
    yTicks,
  };
}

/** A weight trend chart that updates as new entries are logged: the solid
 * orange line is the actual history (a dot per logged weigh-in), the grey
 * dots are the diet plan's own month-by-month intended trajectory —
 * fixed to the plan's start, not recalculated from "today" — so real
 * progress can be read directly against the plan's roadmap. The target is
 * always marked, both as a reference line and, on whichever grey dot first
 * reaches it, as a highlighted milestone. Axis value labels are plain
 * React Native Text absolutely positioned over the SVG rather than SVG
 * <Text> — the latter's baseline handling isn't consistent enough across
 * web/iOS/Android to trust for something this small. */
export function GoalTrendChart({ history, guide, target, width, height = 180, color, guideColor, targetColor, axisColor }: GoalTrendChartProps) {
  const [measuredWidth, setMeasuredWidth] = useState(width ?? 0);
  const chartWidth = width ?? measuredWidth;

  const { historyPath, historyArea, guidePath, historyXY, guideXY, todayX, targetY, xTicks, yTicks } = useMemo(
    () => buildChart(history, guide, target, chartWidth, height),
    [history, guide, target, chartWidth, height]
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

            {/* "Today" marker, so the plan's fixed roadmap and the live
                history can both be read against the same point in time. */}
            {todayX != null ? (
              <Line x1={todayX} y1={PADDING_TOP} x2={todayX} y2={height - PADDING_BOTTOM} stroke={axisColor} strokeWidth={1} strokeDasharray="2 4" />
            ) : null}

            {historyArea ? <Path d={historyArea} fill="url(#goalTrendFill)" /> : null}
            {guidePath ? (
              <Path d={guidePath} stroke={guideColor} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 5" />
            ) : null}
            {historyPath ? (
              <Path d={historyPath} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}

            {/* One grey milestone dot per month of the plan — the one that
                first reaches the target is highlighted instead of grey. */}
            {guideXY.map((p, i) => {
              const isMilestone = Math.abs(p.value - target) < 0.05 && !guideXY.slice(0, i).some((prior) => Math.abs(prior.value - target) < 0.05);
              return isMilestone ? (
                <Circle key={i} cx={p.x} cy={p.y} r={5} fill={targetColor} />
              ) : (
                <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={guideColor} />
              );
            })}

            {/* Every logged weigh-in gets its own dot, not just the latest —
                each is a visible step of progress, not just a smooth
                line implying movement. */}
            {historyXY.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={i === historyXY.length - 1 ? 4 : 2.5} fill={color} />
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

          {/* X-axis month labels — one per plan month */}
          {xTicks.map((tick, i) => {
            const boxWidth = 40;
            return (
              <Text
                key={i}
                style={{
                  position: 'absolute',
                  left: tick.x - boxWidth / 2,
                  width: boxWidth,
                  top: height - PADDING_BOTTOM + 6,
                  fontSize: 9,
                  color: axisColor,
                  textAlign: 'center',
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

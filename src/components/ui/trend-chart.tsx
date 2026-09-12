import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Circle } from 'react-native-svg';

export type TrendChartProps = {
  data: number[];
  width?: number;
  height?: number;
  color: string;
  fillTo?: boolean;
};

function buildPaths(data: number[], width: number, height: number, padding = 6) {
  if (data.length < 2) return { line: '', area: '' };

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / (data.length - 1);

  const points = data.map((value, index) => {
    const x = padding + index * stepX;
    const y = padding + (height - padding * 2) * (1 - (value - min) / range);
    return { x, y };
  });

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const area = `${line} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z`;

  return { line, area, lastPoint: points[points.length - 1] };
}

export function TrendChart({ data, width = 160, height = 56, color, fillTo = true }: TrendChartProps) {
  const { line, area, lastPoint } = useMemo(() => buildPaths(data, width, height), [data, width, height]);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.28} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {fillTo && area ? <Path d={area} fill="url(#trendFill)" /> : null}
        {line ? <Path d={line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
        {lastPoint ? <Circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={color} /> : null}
      </Svg>
    </View>
  );
}

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { TrendPoint } from '../../domain/stats';
import { clay } from '../clay';
import { colors, fonts, spacing } from '../theme';
import { AppText } from './primitives';

const CHART_HEIGHT = 180;
const PADDING = { top: 12, right: 12, bottom: 24, left: 44 };
const DRAW_DASH = 800;
const DRAW_MS = 520;

const gradientId = (prefix: string, reactId: string): string =>
  `${prefix}${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

/**
 * Lightweight SVG line chart for progression trends (e1RM, volume).
 * Custom-built on react-native-svg: renders identically on iOS,
 * Android, and web, and stays testable headlessly.
 */
export const ProgressChart = ({
  points,
  width = 340,
  unitLabel,
  accentColor = colors.accent,
  testID = 'progress-chart',
}: {
  points: TrendPoint[];
  width?: number;
  unitLabel: string;
  accentColor?: string;
  testID?: string;
}) => {
  if (points.length === 0) {
    return (
      <View style={[styles.emptyBox, clay.field, { width }]} testID={`${testID}-empty`}>
        <AppText variant="caption" color={colors.textTertiary}>
          Log a few sessions to see your trend
        </AppText>
      </View>
    );
  }

  const plotKey = points.map((p) => `${p.date}:${p.value}`).join('|');
  return (
    <ProgressChartPlot
      key={plotKey}
      points={points}
      width={width}
      unitLabel={unitLabel}
      accentColor={accentColor}
      testID={testID}
    />
  );
};

const ProgressChartPlot = ({
  points,
  width = 340,
  unitLabel,
  accentColor,
  testID,
}: {
  points: TrendPoint[];
  width?: number;
  unitLabel: string;
  accentColor: string;
  testID: string;
}) => {
  const reducedMotion = Boolean(useReducedMotion());
  const [dashOffset, setDashOffset] = useState(reducedMotion ? 0 : DRAW_DASH);
  const reactId = React.useId();
  const fillId = gradientId('chartArea', reactId);

  const innerWidth = width - PADDING.left - PADDING.right;
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom;
  const values = points.map((p) => p.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || max || 1;
  const yFor = (value: number): number =>
    PADDING.top + innerHeight - ((value - (min - range * 0.1)) / (range * 1.2)) * innerHeight;
  const xFor = (index: number): number =>
    PADDING.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(1)} ${yFor(p.value).toFixed(1)}`)
    .join(' ');
  const baseline = PADDING.top + innerHeight;
  const areaPath = `${path} L ${xFor(points.length - 1).toFixed(1)} ${baseline.toFixed(1)} L ${xFor(0).toFixed(1)} ${baseline.toFixed(1)} Z`;

  useEffect(() => {
    if (reducedMotion) return;
    const started = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - started) / DRAW_MS);
      const eased = 1 - (1 - t) * (1 - t);
      setDashOffset(DRAW_DASH * (1 - eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const gridValues = [min, (min + max) / 2, max];

  return (
    <View testID={testID}>
      <Svg width={width} height={CHART_HEIGHT}>
        <Defs>
          <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={accentColor} stopOpacity="0.28" />
            <Stop offset="1" stopColor={accentColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {gridValues.map((v, i) => (
          <React.Fragment key={`${v}-${i}`}>
            <Line
              x1={PADDING.left}
              y1={yFor(v)}
              x2={width - PADDING.right}
              y2={yFor(v)}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
            <SvgText
              x={PADDING.left - 8}
              y={yFor(v) + 4}
              fill={colors.textTertiary}
              fontSize={10}
              textAnchor="end"
            >
              {Math.round(v)}
            </SvgText>
          </React.Fragment>
        ))}
        <Path d={areaPath} fill={`url(#${fillId})`} stroke="none" />
        <Path
          d={path}
          stroke={accentColor}
          strokeWidth={2.5}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          strokeDasharray={reducedMotion ? undefined : DRAW_DASH}
          strokeDashoffset={reducedMotion ? 0 : dashOffset}
        />
        {points.map((p, i) => (
          <Circle key={p.date + i} cx={xFor(i)} cy={yFor(p.value)} r={4} fill={accentColor} />
        ))}
        <SvgText
          x={PADDING.left}
          y={CHART_HEIGHT - 6}
          fill={colors.textTertiary}
          fontSize={11}
          fontFamily={fonts.display}
        >
          {points[0].date}
        </SvgText>
        <SvgText
          x={width - PADDING.right}
          y={CHART_HEIGHT - 6}
          fill={colors.textTertiary}
          fontSize={11}
          fontFamily={fonts.display}
          textAnchor="end"
        >
          {points[points.length - 1].date}
        </SvgText>
      </Svg>
      <AppText variant="caption" color={colors.textTertiary} style={styles.unitLabel}>
        {unitLabel}
      </AppText>
    </View>
  );
};

/** Simple weekly bar chart (workouts or volume per week). */
export const WeeklyBars = ({
  data,
  width = 340,
  barColor = colors.accent,
  testID = 'weekly-bars',
}: {
  data: { label: string; value: number }[];
  width?: number;
  barColor?: string;
  testID?: string;
}) => {
  const height = 120;
  const max = Math.max(...data.map((d) => d.value), 1);
  const gap = 8;
  const barWidth = data.length > 0 ? (width - gap * (data.length - 1)) / data.length : 0;
  const fillId = gradientId('weeklyBar', React.useId());
  return (
    <View testID={testID}>
      <Svg width={width} height={height + 18}>
        <Defs>
          <LinearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={barColor} stopOpacity="1" />
            <Stop offset="1" stopColor={barColor} stopOpacity="0.4" />
          </LinearGradient>
        </Defs>
        {data.map((d, i) => {
          const barHeight = Math.max(3, (d.value / max) * height);
          return (
            <React.Fragment key={d.label + i}>
              <Rect
                x={i * (barWidth + gap)}
                y={height - barHeight}
                width={barWidth}
                height={barHeight}
                rx={10}
                fill={d.value > 0 ? `url(#${fillId})` : colors.surfaceRaised}
              />
              <SvgText
                x={i * (barWidth + gap) + barWidth / 2}
                y={height + 14}
                fill={colors.textTertiary}
                fontSize={9}
                fontFamily={fonts.display}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyBox: {
    height: CHART_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfacePressed,
    borderRadius: 20,
  },
  unitLabel: { textAlign: 'center', marginTop: spacing.xs },
});

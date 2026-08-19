import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import type { Equipment, MovementPattern } from '../../../domain/types';
import { colors, spacing } from '../../theme';
import { AppText } from '../primitives';
import { CHOREOGRAPHIES, poseAt, type Pt, type ResolvedPose } from './choreography';

/**
 * Procedural exercise demonstration: a consistent side-view line-art
 * character performs the exercise's movement pattern at the style guide's
 * coached tempo (eccentric-emphasis rep loop). Runs identically on iOS,
 * Android, and web, themes itself from the design tokens, and honors
 * reduce-motion (renders a mid-rep still).
 */

const STROKE = 6;
const FIGURE_COLOR = colors.text;
const FAR_COLOR = colors.textTertiary;
const EQUIPMENT_COLOR = colors.accent;

const pts = (list: Pt[]): string => list.map(([x, y]) => `${x},${y}`).join(' ');

const HeldEquipment = ({ kind, at }: { kind: Equipment | undefined; at: Pt }) => {
  switch (kind) {
    case 'barbell':
      // Side view: the near plate face, with a hint of the bar sleeve.
      return (
        <>
          <Circle cx={at[0]} cy={at[1]} r={11} fill="none" stroke={EQUIPMENT_COLOR} strokeWidth={4} />
          <Circle cx={at[0]} cy={at[1]} r={2.5} fill={EQUIPMENT_COLOR} />
        </>
      );
    case 'dumbbell':
      return (
        <>
          <Rect x={at[0] - 8} y={at[1] - 3} width={16} height={6} rx={2} fill={EQUIPMENT_COLOR} />
          <Rect x={at[0] - 10} y={at[1] - 6} width={4} height={12} rx={1.5} fill={EQUIPMENT_COLOR} />
          <Rect x={at[0] + 6} y={at[1] - 6} width={4} height={12} rx={1.5} fill={EQUIPMENT_COLOR} />
        </>
      );
    case 'kettlebell':
      return (
        <>
          <Circle cx={at[0]} cy={at[1] + 6} r={7} fill={EQUIPMENT_COLOR} />
          <Circle cx={at[0]} cy={at[1]} r={5} fill="none" stroke={EQUIPMENT_COLOR} strokeWidth={3} />
        </>
      );
    default:
      return null;
  }
};

const FigureFrame = ({
  pose,
  bench,
  overheadBar,
  equipment,
}: {
  pose: ResolvedPose;
  bench?: boolean;
  overheadBar?: boolean;
  equipment?: Equipment;
}) => (
  <>
    {/* Stage */}
    <Line x1={16} y1={180} x2={184} y2={180} stroke={colors.border} strokeWidth={3} strokeLinecap="round" />
    {bench ? (
      <>
        <Rect x={56} y={150} width={92} height={8} rx={3} fill={colors.surfaceRaised} stroke={colors.textTertiary} strokeWidth={2} />
        <Line x1={68} y1={158} x2={68} y2={178} stroke={colors.textTertiary} strokeWidth={3} strokeLinecap="round" />
        <Line x1={136} y1={158} x2={136} y2={178} stroke={colors.textTertiary} strokeWidth={3} strokeLinecap="round" />
      </>
    ) : null}
    {overheadBar ? (
      <>
        <Line x1={70} y1={38} x2={134} y2={38} stroke={colors.textTertiary} strokeWidth={4} strokeLinecap="round" />
        <Line x1={74} y1={20} x2={74} y2={38} stroke={colors.border} strokeWidth={3} />
        <Line x1={130} y1={20} x2={130} y2={38} stroke={colors.border} strokeWidth={3} />
      </>
    ) : null}

    {/* Far limbs first (dimmed, behind the body) */}
    <Polyline
      points={pts([pose.hip, pose.kneeFar, pose.ankleFar])}
      fill="none"
      stroke={FAR_COLOR}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Torso + near leg */}
    <Polyline
      points={pts([pose.shoulder, pose.hip, pose.kneeNear, pose.ankleNear])}
      fill="none"
      stroke={FIGURE_COLOR}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Arm */}
    <Polyline
      points={pts([pose.shoulder, pose.elbow, pose.wrist])}
      fill="none"
      stroke={FIGURE_COLOR}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Head */}
    <Circle cx={pose.head[0]} cy={pose.head[1]} r={9} fill="none" stroke={FIGURE_COLOR} strokeWidth={STROKE - 1} />

    {/* Held equipment */}
    {pose.equipment ? <HeldEquipment kind={equipment} at={pose.equipment} /> : null}
  </>
);

/** Which held-equipment visual to use for an exercise. */
export const heldEquipmentFor = (
  pattern: MovementPattern,
  equipment: Equipment[],
): Equipment | undefined => {
  if (pattern === 'vertical_pull' || pattern === 'core') return undefined;
  if (equipment.includes('barbell')) return 'barbell';
  if (equipment.includes('dumbbell')) return 'dumbbell';
  if (equipment.includes('kettlebell')) return 'kettlebell';
  if (equipment.includes('machine') || equipment.includes('cable')) return 'dumbbell';
  return undefined;
};

export const ExerciseAnimation = ({
  pattern,
  equipment = [],
  size = 200,
  caption,
  testID = 'exercise-animation',
}: {
  pattern: MovementPattern;
  equipment?: Equipment[];
  size?: number;
  caption?: string;
  testID?: string;
}) => {
  const reducedMotion = useReducedMotion();
  const choreo = CHOREOGRAPHIES[pattern];
  const durationMs = choreo.durationMs ?? 2400;
  // A mid-rep still communicates the movement even without motion.
  const [t, setT] = useState(reducedMotion ? 0.42 : 0);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reducedMotion) return;
    let start: number | undefined;
    const tick = (now: number): void => {
      if (start === undefined) start = now;
      setT(((now - start) % durationMs) / durationMs);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [durationMs, reducedMotion]);

  const pose = poseAt(choreo, t);
  const held = heldEquipmentFor(pattern, equipment);

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLabel={`Animated demonstration of the ${pattern.replace(/_/g, ' ')} movement pattern`}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <FigureFrame pose={pose} bench={choreo.bench} overheadBar={choreo.overheadBar} equipment={held} />
      </Svg>
      {caption ? (
        <AppText variant="caption" color={colors.textTertiary}>
          {caption}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.xs },
});

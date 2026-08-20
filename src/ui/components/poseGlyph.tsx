import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import type { Equipment, MovementPattern } from '../../domain/types';
import { colors } from '../theme';
import { heldEquipmentFor } from './exerciseAnimation';
import { CHOREOGRAPHIES, poseAt, type Pt, type ResolvedPose } from './exerciseAnimation/choreography';

/**
 * Static mid-rep mark for exercise cards. Same choreography and held-equipment
 * rules as ExerciseAnimation, frozen at the reduce-motion still (t = 0.42).
 * Ground line is omitted so the figure stays readable at 44–48 pt.
 */

const MID_REP = 0.42;
const STROKE = 8;
const FIGURE_COLOR = colors.text;
const FAR_COLOR = colors.textTertiary;
const EQUIPMENT_COLOR = colors.accent;

const pts = (list: Pt[]): string => list.map(([x, y]) => `${x},${y}`).join(' ');

const HeldEquipment = ({ kind, at }: { kind: Equipment | undefined; at: Pt }) => {
  switch (kind) {
    case 'barbell':
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
    {bench ? (
      <>
        <Rect
          x={56}
          y={150}
          width={92}
          height={8}
          rx={3}
          fill={colors.surfaceRaised}
          stroke={colors.textTertiary}
          strokeWidth={2}
        />
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

    <Polyline
      points={pts([pose.hip, pose.kneeFar, pose.ankleFar])}
      fill="none"
      stroke={FAR_COLOR}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points={pts([pose.shoulder, pose.hip, pose.kneeNear, pose.ankleNear])}
      fill="none"
      stroke={FIGURE_COLOR}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline
      points={pts([pose.shoulder, pose.elbow, pose.wrist])}
      fill="none"
      stroke={FIGURE_COLOR}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={pose.head[0]} cy={pose.head[1]} r={9} fill="none" stroke={FIGURE_COLOR} strokeWidth={STROKE - 1} />
    {pose.equipment ? <HeldEquipment kind={equipment} at={pose.equipment} /> : null}
  </>
);

export const PoseGlyph = ({
  pattern,
  equipment = [],
  size = 48,
  testID,
  decorative = false,
}: {
  pattern: MovementPattern;
  equipment?: Equipment[];
  size?: number;
  testID?: string;
  /** Hide from assistive tech when a parent already names the exercise. */
  decorative?: boolean;
}) => {
  const choreo = CHOREOGRAPHIES[pattern];
  const pose = poseAt(choreo, MID_REP);
  const held = heldEquipmentFor(pattern, equipment);
  const patternWords = pattern.replace(/_/g, ' ');

  return (
    <View
      testID={testID}
      accessibilityLabel={`${patternWords} pose`}
      importantForAccessibility={decorative ? 'no' : 'yes'}
      accessibilityElementsHidden={decorative}
      pointerEvents="none"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <FigureFrame pose={pose} bench={choreo.bench} overheadBar={choreo.overheadBar} equipment={held} />
      </Svg>
    </View>
  );
};

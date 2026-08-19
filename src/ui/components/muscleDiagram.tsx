import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';
import type { MuscleGroup } from '../../domain/types';
import { colors, spacing } from '../theme';
import { AppText } from './primitives';

interface Region {
  view: 'front' | 'back';
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  mirrored?: boolean; // draw on both left and right side
}

/** Schematic muscle regions on a 100x220 body, per style guide:
 * consistent silhouettes, primary muscles lit in accent, secondary dimmed. */
const REGIONS: Record<MuscleGroup, Region[]> = {
  chest: [{ view: 'front', cx: 50, cy: 62, rx: 17, ry: 10 }],
  shoulders: [
    { view: 'front', cx: 28, cy: 52, rx: 7, ry: 6, mirrored: true },
    { view: 'back', cx: 28, cy: 52, rx: 7, ry: 6, mirrored: true },
  ],
  biceps: [{ view: 'front', cx: 24, cy: 75, rx: 5.5, ry: 10, mirrored: true }],
  triceps: [{ view: 'back', cx: 24, cy: 75, rx: 5.5, ry: 10, mirrored: true }],
  forearms: [
    { view: 'front', cx: 20, cy: 100, rx: 4.5, ry: 11, mirrored: true },
    { view: 'back', cx: 20, cy: 100, rx: 4.5, ry: 11, mirrored: true },
  ],
  traps: [{ view: 'back', cx: 50, cy: 47, rx: 13, ry: 7 }],
  back: [{ view: 'back', cx: 50, cy: 66, rx: 14, ry: 10 }],
  lats: [{ view: 'back', cx: 38, cy: 82, rx: 7, ry: 12, mirrored: true }],
  lower_back: [{ view: 'back', cx: 50, cy: 100, rx: 9, ry: 8 }],
  core: [{ view: 'front', cx: 50, cy: 92, rx: 11, ry: 15 }],
  glutes: [{ view: 'back', cx: 50, cy: 120, rx: 14, ry: 10 }],
  quads: [{ view: 'front', cx: 40, cy: 145, rx: 8, ry: 18, mirrored: true }],
  hamstrings: [{ view: 'back', cx: 40, cy: 148, rx: 8, ry: 17, mirrored: true }],
  calves: [
    { view: 'back', cx: 40, cy: 185, rx: 6, ry: 13, mirrored: true },
    { view: 'front', cx: 40, cy: 188, rx: 5, ry: 11, mirrored: true },
  ],
};

const BODY_OUTLINE =
  'M50 8 C58 8 62 14 62 21 C62 26 60 30 57 33 ' + // head
  'C66 36 74 40 76 50 C78 58 76 66 74 74 L72 96 C72 102 70 108 68 112 ' + // right arm side
  'L66 96 L66 76 L64 112 C66 122 66 130 64 142 C63 158 62 172 62 184 C62 196 60 206 58 212 ' + // right leg
  'L52 212 L53 190 L50 150 L47 190 L48 212 L42 212 C40 206 38 196 38 184 C38 172 37 158 36 142 ' + // left leg
  'C34 130 34 122 36 112 L34 76 L34 96 L32 112 C30 108 28 102 28 96 L26 74 C24 66 22 58 24 50 ' + // left arm side
  'C26 40 34 36 43 33 C40 30 38 26 38 21 C38 14 42 8 50 8 Z';

const BodyView = ({
  view,
  primary,
  secondary,
  width,
}: {
  view: 'front' | 'back';
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  width: number;
}) => {
  const height = (width / 100) * 220;
  const drawRegions = (muscles: MuscleGroup[], fill: string, opacity: number) =>
    muscles.flatMap((muscle) =>
      (REGIONS[muscle] ?? [])
        .filter((r) => r.view === view)
        .flatMap((r) => {
          const shapes = [
            <Ellipse key={`${muscle}-${r.cx}-${r.cy}`} cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} fill={fill} opacity={opacity} />,
          ];
          if (r.mirrored) {
            shapes.push(
              <Ellipse
                key={`${muscle}-${r.cx}-${r.cy}-m`}
                cx={100 - r.cx}
                cy={r.cy}
                rx={r.rx}
                ry={r.ry}
                fill={fill}
                opacity={opacity}
              />,
            );
          }
          return shapes;
        }),
    );

  return (
    <View style={styles.bodyView}>
      <Svg width={width} height={height} viewBox="0 0 100 220">
        <Path d={BODY_OUTLINE} fill={colors.surfaceRaised} stroke={colors.border} strokeWidth={1} />
        {drawRegions(secondary, colors.textTertiary, 0.55)}
        {drawRegions(primary, colors.accent, 0.9)}
      </Svg>
      <AppText variant="caption" color={colors.textTertiary}>
        {view === 'front' ? 'Front' : 'Back'}
      </AppText>
    </View>
  );
};

/**
 * Educational front/back muscle-target diagram. Primary muscles glow in
 * the accent color, secondary muscles are dimmed. Serves as the always-
 * available visual for every exercise (Lottie form animations layer on
 * top as the asset pipeline delivers them).
 */
export const MuscleDiagram = ({
  primary,
  secondary,
  width = 130,
  testID = 'muscle-diagram',
}: {
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  width?: number;
  testID?: string;
}) => (
  <View
    style={styles.container}
    testID={testID}
    accessibilityLabel={`Muscle diagram. Primary: ${primary.join(', ') || 'none'}. Secondary: ${secondary.join(', ') || 'none'}.`}
  >
    <BodyView view="front" primary={primary} secondary={secondary} width={width} />
    <BodyView view="back" primary={primary} secondary={secondary} width={width} />
  </View>
);

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  bodyView: { alignItems: 'center', gap: spacing.xs },
});

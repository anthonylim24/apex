import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

/**
 * A single, earned confetti burst for PR celebrations: 14 deterministic
 * pieces fall once (~1.1 s) and stop. No loops, no variable rewards, and
 * nothing renders when the user prefers reduced motion.
 */

interface PieceSpec {
  xPct: number; // horizontal start, % of container width
  drift: number; // horizontal drift over the fall, px
  delay: number;
  size: number;
  color: string;
  spin: number; // total rotation, deg
}

const PIECES: PieceSpec[] = [
  { xPct: 8, drift: 18, delay: 0, size: 9, color: colors.mint, spin: 260 },
  { xPct: 15, drift: -12, delay: 90, size: 7, color: colors.yellow, spin: -200 },
  { xPct: 24, drift: 22, delay: 30, size: 8, color: colors.pink, spin: 320 },
  { xPct: 32, drift: -20, delay: 140, size: 10, color: colors.purple, spin: -280 },
  { xPct: 41, drift: 10, delay: 60, size: 7, color: colors.blue, spin: 240 },
  { xPct: 49, drift: -16, delay: 0, size: 9, color: colors.orange, spin: -300 },
  { xPct: 57, drift: 24, delay: 110, size: 8, color: colors.mint, spin: 280 },
  { xPct: 65, drift: -8, delay: 50, size: 7, color: colors.pink, spin: -220 },
  { xPct: 73, drift: 14, delay: 160, size: 10, color: colors.yellow, spin: 300 },
  { xPct: 81, drift: -22, delay: 20, size: 8, color: colors.purple, spin: -260 },
  { xPct: 88, drift: 12, delay: 130, size: 7, color: colors.blue, spin: 240 },
  { xPct: 94, drift: -14, delay: 80, size: 9, color: colors.orange, spin: -320 },
  { xPct: 37, drift: 26, delay: 190, size: 6, color: colors.mint, spin: 340 },
  { xPct: 61, drift: -26, delay: 200, size: 6, color: colors.pink, spin: -340 },
];

const FALL_MS = 1100;
const FALL_DISTANCE = 340;

const Piece = ({ spec }: { spec: PieceSpec }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      spec.delay,
      withTiming(1, { duration: FALL_MS, easing: Easing.in(Easing.quad) }),
    );
  }, [progress, spec.delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: progress.value * FALL_DISTANCE },
      { translateX: progress.value * spec.drift },
      { rotate: `${progress.value * spec.spin}deg` },
    ],
    opacity: progress.value < 0.75 ? 1 : 1 - (progress.value - 0.75) * 4,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: `${spec.xPct}%`,
          width: spec.size,
          height: spec.size * 1.6,
          backgroundColor: spec.color,
        },
        style,
      ]}
    />
  );
};

export const ConfettiBurst = ({ testID = 'confetti-burst' }: { testID?: string }) => {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;
  return (
    <View style={styles.container} pointerEvents="none" testID={testID}>
      {PIECES.map((spec, i) => (
        <Piece key={i} spec={spec} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    overflow: 'visible',
    zIndex: 11,
  },
  piece: {
    position: 'absolute',
    top: -20,
    borderRadius: 2,
  },
});

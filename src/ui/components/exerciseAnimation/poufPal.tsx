import React, { useEffect } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { MovementPattern } from '../../../domain/types';
import { clay } from '../../clay';
import { colors, radius, tones, type Tone } from '../../theme';

const PAL: Record<MovementPattern, ImageSourcePropType> = {
  squat: require('../../../../assets/pouf-pals/squat.jpg'),
  hinge: require('../../../../assets/pouf-pals/hinge.jpg'),
  lunge: require('../../../../assets/pouf-pals/lunge.jpg'),
  horizontal_push: require('../../../../assets/pouf-pals/bench.jpg'),
  horizontal_pull: require('../../../../assets/pouf-pals/row.jpg'),
  vertical_push: require('../../../../assets/pouf-pals/press.jpg'),
  vertical_pull: require('../../../../assets/pouf-pals/pullup.jpg'),
  isolation: require('../../../../assets/pouf-pals/curl.jpg'),
  core: require('../../../../assets/pouf-pals/plank.jpg'),
  carry: require('../../../../assets/pouf-pals/carry.jpg'),
};

const FRAME_TONE: Record<MovementPattern, Tone> = {
  squat: 'pink',
  hinge: 'orange',
  lunge: 'yellow',
  horizontal_push: 'mint',
  horizontal_pull: 'blue',
  vertical_push: 'purple',
  vertical_pull: 'blue',
  isolation: 'pink',
  core: 'mint',
  carry: 'orange',
};

const LOOP_MS = 2400;

type Motion = { sx: number; sy: number; dy: number; rot: number };

const MOTION: Record<MovementPattern, Motion> = {
  squat: { sx: 1.08, sy: 0.82, dy: 10, rot: 0 },
  hinge: { sx: 1.04, sy: 0.94, dy: 5, rot: -9 },
  lunge: { sx: 1.05, sy: 0.9, dy: 4, rot: 6 },
  horizontal_push: { sx: 1.08, sy: 0.88, dy: -8, rot: 0 },
  horizontal_pull: { sx: 1.04, sy: 0.95, dy: 4, rot: 8 },
  vertical_push: { sx: 0.94, sy: 1.1, dy: -12, rot: 0 },
  vertical_pull: { sx: 0.98, sy: 1.07, dy: -10, rot: 0 },
  isolation: { sx: 1.04, sy: 0.96, dy: 0, rot: -10 },
  core: { sx: 1.06, sy: 0.94, dy: 3, rot: 0 },
  carry: { sx: 1.03, sy: 0.97, dy: 3, rot: 5 },
};

/**
 * Pouf Pal demo — clay still plus a 2.4s character loop:
 * anticipate → effort squash → hold → stretch home → settle wobble.
 * A ground shadow fattens on contact. Reduce-motion holds the still.
 */
export const PoufPal = ({
  pattern,
  size = 200,
}: {
  pattern: MovementPattern;
  size?: number;
}) => {
  const reducedMotion = useReducedMotion();
  const t = useSharedValue(0);
  const sway = useSharedValue(0);
  const motion = MOTION[pattern];
  const frameTone = tones[FRAME_TONE[pattern]];

  useEffect(() => {
    if (reducedMotion) return;
    t.value = withRepeat(
      withTiming(1, { duration: LOOP_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    sway.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => {
      t.value = 0;
      sway.value = 0;
    };
  }, [reducedMotion, t, sway]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = t.value;
    const anticipate = interpolate(p, [0, 0.12, 0.18, 1], [0, 1, 0, 0]);
    const effort = interpolate(p, [0, 0.16, 0.48, 0.62, 1], [0, 0, 1, 1, 0]);
    const stretch = interpolate(p, [0, 0.55, 0.72, 0.88, 1], [0, 0, 1, 0.2, 0]);
    const scaleX = 1 + anticipate * 0.04 + effort * (motion.sx - 1) + stretch * 0.03;
    const scaleY = 1 - anticipate * 0.05 + effort * (motion.sy - 1) + stretch * 0.04;
    return {
      transform: [
        { translateY: effort * motion.dy + stretch * -4 },
        { rotate: `${effort * motion.rot + sway.value * 1.6}deg` },
        { scaleX },
        { scaleY },
      ],
    };
  });

  const shadowStyle = useAnimatedStyle(() => {
    const contact = interpolate(t.value, [0, 0.2, 0.48, 0.7, 1], [0.35, 0.45, 0.85, 0.4, 0.35]);
    return {
      opacity: 0.28 + contact * 0.22,
      transform: [{ scaleX: 0.72 + contact * 0.28 }, { scaleY: 1 }],
    };
  });

  return (
    <View
      style={[
        styles.frame,
        clay.card,
        { width: size, height: size, borderColor: frameTone },
      ]}
    >
      <Animated.View style={[styles.shadow, shadowStyle]} />
      <Animated.View style={[styles.stage, animatedStyle]}>
        <Image source={PAL[pattern]} style={styles.image} resizeMode="cover" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  image: { width: '100%', height: '100%' },
  shadow: {
    position: 'absolute',
    bottom: 10,
    width: '46%',
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000000',
    zIndex: 1,
  },
});

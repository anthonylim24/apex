import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
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

const VIDEO: Record<MovementPattern, VideoSource> = {
  squat: require('../../../../assets/pouf-pals/videos/squat.mp4'),
  hinge: require('../../../../assets/pouf-pals/videos/hinge.mp4'),
  lunge: require('../../../../assets/pouf-pals/videos/lunge.mp4'),
  horizontal_push: require('../../../../assets/pouf-pals/videos/bench.mp4'),
  horizontal_pull: require('../../../../assets/pouf-pals/videos/row.mp4'),
  vertical_push: require('../../../../assets/pouf-pals/videos/press.mp4'),
  vertical_pull: require('../../../../assets/pouf-pals/videos/pullup.mp4'),
  isolation: require('../../../../assets/pouf-pals/videos/curl.mp4'),
  core: require('../../../../assets/pouf-pals/videos/plank.mp4'),
  carry: require('../../../../assets/pouf-pals/videos/carry.mp4'),
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
/** Tiny tiles (plan rows) stay stills so we don't spin up six players. */
const VIDEO_MIN_SIZE = 72;

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

const PalStill = ({ pattern }: { pattern: MovementPattern }) => (
  <Image source={PAL[pattern]} style={styles.image} resizeMode="cover" />
);

const PalClip = ({ pattern }: { pattern: MovementPattern }) => {
  const [ready, setReady] = useState(false);
  const player = useVideoPlayer(VIDEO[pattern], (next) => {
    next.loop = true;
    next.muted = true;
    next.audioMixingMode = 'mixWithOthers';
    next.play();
  });

  return (
    <VideoView
      player={player}
      style={[styles.image, ready ? styles.clipReady : styles.clipPending]}
      contentFit="cover"
      nativeControls={false}
      playsInline
      pointerEvents="none"
      onFirstFrameRender={() => setReady(true)}
    />
  );
};

/**
 * Pouf Pal — looping exercise clip via expo-video when motion is allowed
 * and the tile is large enough. Reduce-motion and tiny tiles use the still
 * (with a 2.4s squash on mid-size stills).
 */
export const PoufPal = ({
  pattern,
  size = 200,
  framed = true,
}: {
  pattern: MovementPattern;
  size?: number;
  /** Rest-ring fill skips the clay frame so the clip can sit inside the timer. */
  framed?: boolean;
}) => {
  const reducedMotion = useReducedMotion();
  const playClip = !reducedMotion && size >= VIDEO_MIN_SIZE;
  const t = useSharedValue(0);
  const sway = useSharedValue(0);
  const motion = MOTION[pattern];
  const frameTone = tones[FRAME_TONE[pattern]];

  useEffect(() => {
    if (reducedMotion || playClip) return;
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
  }, [reducedMotion, playClip, t, sway]);

  const animatedStyle = useAnimatedStyle(() => {
    if (playClip) return {};
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

  return (
    <View
      style={[
        styles.frame,
        framed ? clay.card : styles.bare,
        { width: size, height: size, borderColor: framed ? frameTone : 'transparent' },
      ]}
    >
      <View style={[styles.clip, !framed && styles.clipBare]}>
        {framed ? <View style={styles.shine} pointerEvents="none" /> : null}
        <Animated.View style={[styles.stage, animatedStyle]}>
          <PalStill pattern={pattern} />
          {playClip ? (
            <View style={styles.clipLayer}>
              <PalClip key={pattern} pattern={pattern} />
            </View>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  clip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radius.lg - 3,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    zIndex: 2,
  },
  stage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  clipLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  image: { width: '100%', height: '100%' },
  bare: { borderWidth: 0, backgroundColor: 'transparent' },
  clipBare: { borderRadius: 0 },
  clipPending: { opacity: 0 },
  clipReady: { opacity: 1 },
});

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, spacing } from '../theme';
import { AppText, Button } from './primitives';

const RING_SIZE = 220;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const RING_GRAD_ID = 'rest-ring-stroke';
const BREATHE_MS = 900;

const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.ceil(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Rest timer overlay shown between sets. Adjustable on the fly (+/-15s),
 * skippable at any time — the timer serves the lifter, not the reverse.
 * The ring warms from rest-cyan to action-lime in the final seconds so a
 * glance says "almost go" without reading the numerals.
 */
export const RestTimerOverlay = ({
  secondsRemaining,
  totalSeconds,
  nextUp,
  encouragement,
  onAdjust,
  onSkip,
  testID = 'rest-timer',
}: {
  secondsRemaining: number;
  totalSeconds: number;
  nextUp?: string;
  encouragement?: string;
  onAdjust: (deltaSeconds: number) => void;
  onSkip: () => void;
  testID?: string;
}) => {
  const progress = totalSeconds > 0 ? Math.max(0, secondsRemaining / totalSeconds) : 0;
  const almostGo = secondsRemaining <= 10;
  const labelColor = almostGo ? colors.accent : colors.rest;
  const reducedMotion = useReducedMotion();
  const breathe = useSharedValue(1);
  const breatheStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathe.value }],
  }));

  useEffect(() => {
    if (reducedMotion || !almostGo) {
      // eslint-disable-next-line react-hooks/immutability -- SharedValue
      breathe.value = 1;
      return;
    }
    breathe.value = withRepeat(
      withSequence(withTiming(1.03, { duration: BREATHE_MS }), withTiming(1, { duration: BREATHE_MS })),
      -1,
      false,
    );
    return () => {
      breathe.value = 1;
    };
  }, [almostGo, reducedMotion, breathe]);

  return (
    <View style={styles.container} testID={testID}>
      {encouragement ? (
        <AppText variant="caption" color={colors.textSecondary} testID={`${testID}-encouragement`}>
          {encouragement}
        </AppText>
      ) : null}
      <Animated.View style={[styles.ringWrap, breatheStyle]}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Defs>
            <LinearGradient id={RING_GRAD_ID} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={almostGo ? colors.mint : colors.blue} />
              <Stop offset="1" stopColor={almostGo ? colors.yellow : colors.mint} />
            </LinearGradient>
          </Defs>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={colors.surfaceRaised}
            strokeWidth={STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            stroke={`url(#${RING_GRAD_ID})`}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.clockOverlay} pointerEvents="none">
          <AppText variant="displayXl" testID={`${testID}-clock`}>
            {formatClock(secondsRemaining)}
          </AppText>
          <AppText variant="label" color={labelColor}>
            {almostGo ? 'Almost go' : 'Resting'}
          </AppText>
        </View>
      </Animated.View>
      {nextUp ? (
        <AppText variant="body" color={colors.textSecondary}>
          Next: {nextUp}
        </AppText>
      ) : null}
      <View style={styles.controls}>
        <Button
          label="−15s"
          variant="secondary"
          onPress={() => onAdjust(-15)}
          style={styles.controlButton}
          testID={`${testID}-minus`}
        />
        <Button
          label="+15s"
          variant="secondary"
          onPress={() => onAdjust(15)}
          style={styles.controlButton}
          testID={`${testID}-plus`}
        />
        <Button
          label="Skip"
          variant="primary"
          onPress={onSkip}
          style={styles.controlButton}
          testID={`${testID}-skip`}
          accessibilityHint="Ends the rest period now"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.xl },
  ringWrap: { width: RING_SIZE, height: RING_SIZE },
  clockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  controlButton: { flex: 1 },
});

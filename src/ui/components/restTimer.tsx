import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing } from '../theme';
import { AppText, Button } from './primitives';

const RING_SIZE = 220;
const STROKE = 10;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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
  const ringColor = almostGo ? colors.active : colors.rest;
  return (
    <View style={styles.container} testID={testID}>
      <AppText variant="label" color={ringColor}>
        {almostGo ? 'Almost go' : 'Resting'}
      </AppText>
      {encouragement ? (
        <AppText variant="caption" color={colors.textSecondary} testID={`${testID}-encouragement`}>
          {encouragement}
        </AppText>
      ) : null}
      <View style={styles.ringWrap}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
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
            stroke={ringColor}
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
        </View>
      </View>
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

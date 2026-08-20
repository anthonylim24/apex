import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { PersonalRecord, Unit } from '../../domain/types';
import { formatWeight } from '../../domain/units';
import { clay } from '../clay';
import { colors, motion, radius, spacing } from '../theme';
import { ConfettiBurst } from './confettiBurst';
import { AppText, Button } from './primitives';

const PR_LABEL: Record<PersonalRecord['kind'], string> = {
  weight: 'Heaviest weight',
  estimated_1rm: 'Estimated 1RM',
  reps_at_weight: 'Rep record',
};

/**
 * Light PR celebration: one purposeful pulse, no confetti spam, honors
 * reduce-motion. Celebration acknowledges real achievement — it is not
 * a variable-reward engagement mechanic (see docs/design/intent-audit.md).
 */
export const PrCelebration = ({
  records,
  exerciseNames,
  unit,
  onDismiss,
  testID = 'pr-celebration',
}: {
  records: PersonalRecord[];
  exerciseNames: Record<string, string>;
  unit: Unit;
  onDismiss: () => void;
  testID?: string;
}) => {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(reducedMotion ? 1 : 0.8);
  const opacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (reducedMotion) return;
    opacity.value = withTiming(1, { duration: motion.base });
    scale.value = withSequence(
      withTiming(1.04, { duration: motion.base, easing: Easing.out(Easing.quad) }),
      withDelay(40, withTiming(1, { duration: motion.fast })),
    );
  }, [opacity, scale, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (records.length === 0) return null;

  return (
    <View style={styles.backdrop} testID={testID}>
      <ConfettiBurst />
      <Animated.View style={[styles.card, clay.card, animatedStyle]}>
        <View style={[styles.medal, clay.blob]}>
          <AppText variant="title" color={colors.textInverse}>
            PR
          </AppText>
        </View>
        <AppText variant="title" style={styles.title}>
          New personal record{records.length > 1 ? 's' : ''}
        </AppText>
        {records.map((record) => (
          <View key={`${record.exerciseId}-${record.kind}`} style={styles.row}>
            <AppText variant="bodyBold">{exerciseNames[record.exerciseId] ?? record.exerciseId}</AppText>
            <AppText variant="body" color={colors.pr}>
              {PR_LABEL[record.kind]}: {formatWeight(record.valueKg, unit)}
              {record.kind === 'weight' ? ` × ${record.reps}` : ''}
            </AppText>
          </View>
        ))}
        <Button label="Keep going" onPress={onDismiss} style={styles.button} testID={`${testID}-dismiss`} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 7, 9, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 10,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  medal: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { textAlign: 'center' },
  row: { alignItems: 'center', gap: spacing.xs },
  button: { alignSelf: 'stretch', marginTop: spacing.md },
});

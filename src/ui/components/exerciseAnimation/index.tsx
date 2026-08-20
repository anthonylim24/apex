import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Equipment, MovementPattern } from '../../../domain/types';
import { colors, spacing } from '../../theme';
import { AppText } from '../primitives';
import { PoufPal } from './poufPal';

/**
 * Exercise demonstration: a Pouf Pal clip of the movement (expo-video),
 * or the clay still with a 2.4s squash when motion is reduced or the
 * tile is too small. PoseGlyph still uses the procedural choreography.
 */

/** Which held-equipment visual to use for an exercise (pose glyphs). */
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
  equipment: _equipment = [],
  size = 200,
  caption,
  testID = 'exercise-animation',
}: {
  pattern: MovementPattern;
  equipment?: Equipment[];
  size?: number;
  caption?: string;
  testID?: string;
}) => (
  <View
    style={styles.container}
    testID={testID}
    accessibilityLabel={`Animated demonstration of the ${pattern.replace(/_/g, ' ')} movement pattern`}
  >
    <PoufPal pattern={pattern} size={size} />
    {caption ? (
      <AppText variant="caption" color={colors.textTertiary}>
        {caption}
      </AppText>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacing.xs },
});

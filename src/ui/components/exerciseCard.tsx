import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Exercise } from '../../domain/types';
import { clay } from '../clay';
import { colors, radius, spacing, touch, type Tone } from '../theme';
import { AppText, Badge } from './primitives';
import { PoseGlyph } from './poseGlyph';

const DIFFICULTY_TONE: Record<Exercise['difficulty'], Tone> = {
  beginner: 'mint',
  intermediate: 'yellow',
  advanced: 'pink',
};

export const formatMuscle = (muscle: string): string =>
  muscle.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export const ExerciseCard = ({
  exercise,
  isFavorite,
  onPress,
  onToggleFavorite,
  testID,
}: {
  exercise: Exercise;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  testID?: string;
}) => (
  <Pressable
    testID={testID ?? `exercise-card-${exercise.id}`}
    accessibilityRole="button"
    accessibilityLabel={`${exercise.name}. ${exercise.primaryMuscles.map(formatMuscle).join(', ')}. ${exercise.difficulty}.`}
    onPress={onPress}
    style={({ pressed }) => [styles.card, clay.row, pressed && styles.cardPressed]}
  >
    <PoseGlyph pattern={exercise.movementPattern} equipment={exercise.equipment} size={48} decorative />
    <View style={styles.main}>
      <AppText variant="bodyBold" numberOfLines={1}>
        {exercise.name}
        {exercise.isCustom ? '  •  custom' : ''}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {exercise.primaryMuscles.map(formatMuscle).join(', ')} ·{' '}
        {exercise.equipment.map(formatMuscle).join(', ')}
      </AppText>
      <Badge label={exercise.difficulty} tone={DIFFICULTY_TONE[exercise.difficulty]} />
    </View>
    {onToggleFavorite ? (
      <Pressable
        testID={`${testID ?? `exercise-card-${exercise.id}`}-favorite`}
        accessibilityRole="switch"
        accessibilityLabel={`Favorite ${exercise.name}`}
        accessibilityState={{ checked: isFavorite }}
        onPress={onToggleFavorite}
        hitSlop={touch.hitSlop}
        style={styles.favorite}
      >
        <AppText variant="title" color={isFavorite ? colors.pr : colors.textTertiary}>
          {isFavorite ? '★' : '☆'}
        </AppText>
      </Pressable>
    ) : null}
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.lg + 6,
    minHeight: touch.min + 16,
    gap: spacing.md,
  },
  cardPressed: { backgroundColor: colors.surfacePressed },
  main: { flex: 1, gap: spacing.xs },
  favorite: {
    width: touch.min,
    height: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

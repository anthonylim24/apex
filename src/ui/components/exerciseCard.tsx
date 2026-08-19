import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Exercise } from '../../domain/types';
import { colors, radius, spacing, touch } from '../theme';
import { AppText, Badge } from './primitives';

const DIFFICULTY_COLORS: Record<Exercise['difficulty'], string> = {
  beginner: colors.success,
  intermediate: colors.warning,
  advanced: colors.danger,
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
    style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
  >
    <View style={styles.main}>
      <AppText variant="bodyBold" numberOfLines={1}>
        {exercise.name}
        {exercise.isCustom ? '  •  custom' : ''}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {exercise.primaryMuscles.map(formatMuscle).join(', ')} ·{' '}
        {exercise.equipment.map(formatMuscle).join(', ')}
      </AppText>
      <Badge
        label={exercise.difficulty}
        color={DIFFICULTY_COLORS[exercise.difficulty]}
        background={colors.surfaceRaised}
      />
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
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

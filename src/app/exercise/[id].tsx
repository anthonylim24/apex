import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { e1RmTrend } from '@/domain/stats';
import { toDisplayWeight } from '@/domain/units';
import { useExerciseLibrary, useFavorites, useProfile, useSessions, useToggleFavorite } from '@/state/queries';
import { formatMuscle } from '@/ui/components/exerciseCard';
import { MuscleDiagram } from '@/ui/components/muscleDiagram';
import { ProgressChart } from '@/ui/components/progressChart';
import { AppText, Badge, Button, Card, Screen } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';

/** Exercise detail: education first — what it is, how to do it, what it
 * trains — plus your own progression on it. */
export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { byId } = useExerciseLibrary();
  const favorites = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const sessions = useSessions();
  const profile = useProfile();

  const exercise = id ? byId[id] : undefined;
  if (!exercise) {
    return (
      <Screen testID="exercise-detail-screen">
        <AppText variant="title">Exercise not found</AppText>
        <Button label="Back to library" onPress={() => router.back()} />
      </Screen>
    );
  }

  const unit = profile.data?.unit ?? 'kg';
  const isFavorite = (favorites.data ?? []).includes(exercise.id);
  const trend = e1RmTrend(sessions.data ?? [], exercise.id).map((p) => ({
    ...p,
    value: Math.round(toDisplayWeight(p.value, unit) * 10) / 10,
  }));

  return (
    <Screen testID="exercise-detail-screen">
      <View style={styles.header}>
        <Button label="‹ Back" variant="ghost" compact onPress={() => router.back()} testID="exercise-back" />
        <Button
          label={isFavorite ? '★ Favorited' : '☆ Favorite'}
          variant="secondary"
          compact
          onPress={() => toggleFavorite.mutate(exercise.id)}
          testID="exercise-favorite"
        />
      </View>

      <AppText variant="title" testID="exercise-name">
        {exercise.name}
      </AppText>
      <View style={styles.badges}>
        <Badge label={exercise.difficulty} color={colors.accent} />
        <Badge label={formatMuscle(exercise.movementPattern)} />
        {exercise.equipment.map((eq) => (
          <Badge key={eq} label={formatMuscle(eq)} />
        ))}
      </View>

      <AppText variant="body" color={colors.textSecondary} style={styles.description}>
        {exercise.description}
      </AppText>

      <Card style={styles.card} testID="exercise-muscles">
        <AppText variant="label" color={colors.textTertiary}>
          Muscles targeted
        </AppText>
        <MuscleDiagram primary={exercise.primaryMuscles} secondary={exercise.secondaryMuscles} />
        <AppText variant="caption" color={colors.textSecondary}>
          Primary: {exercise.primaryMuscles.map(formatMuscle).join(', ')}
          {exercise.secondaryMuscles.length > 0
            ? `  ·  Secondary: ${exercise.secondaryMuscles.map(formatMuscle).join(', ')}`
            : ''}
        </AppText>
      </Card>

      <Card style={styles.card} testID="exercise-instructions">
        <AppText variant="label" color={colors.textTertiary}>
          How to perform
        </AppText>
        {exercise.instructions.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <AppText variant="bodyBold" color={colors.accent}>
              {i + 1}
            </AppText>
            <AppText variant="body" style={styles.stepText}>
              {step}
            </AppText>
          </View>
        ))}
      </Card>

      <Card style={styles.card} testID="exercise-trend">
        <AppText variant="label" color={colors.textTertiary}>
          Your estimated 1RM trend
        </AppText>
        <ProgressChart points={trend} unitLabel={`Estimated one-rep max (${unit})`} width={300} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  description: { marginVertical: spacing.lg, lineHeight: 24 },
  card: { gap: spacing.md, marginBottom: spacing.lg },
  stepRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  stepText: { flex: 1, lineHeight: 22 },
});

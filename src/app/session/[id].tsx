import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { effectiveRpe } from '@/domain/effort';
import { sessionMinutes, sessionVolumeKg } from '@/domain/stats';
import { formatWeight } from '@/domain/units';
import { useExerciseLibrary, useProfile, useSessions } from '@/state/queries';
import { AppText, Button, Card, Screen } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';

/** Read-only detail of a past workout: every exercise, every set. */
export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const sessions = useSessions();
  const profile = useProfile();
  const { byId } = useExerciseLibrary();

  const session = (sessions.data ?? []).find((s) => s.id === id);
  const unit = profile.data?.unit ?? 'kg';

  if (!session) {
    return (
      <Screen testID="session-detail-screen">
        <AppText variant="title">Workout not found</AppText>
        <Button label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen testID="session-detail-screen">
      <View style={styles.header}>
        <Button label="‹ Back" variant="ghost" compact onPress={() => router.back()} testID="session-back" />
      </View>
      <AppText variant="title">{session.name}</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.meta}>
        {session.startedAt.slice(0, 10)} · {sessionMinutes(session)} min ·{' '}
        {formatWeight(sessionVolumeKg(session), unit)} total volume
      </AppText>

      {session.exercises.map((ex) => (
        <Card key={ex.id} style={styles.card} testID={`session-exercise-${ex.exerciseId}`}>
          <AppText variant="bodyBold">{byId[ex.exerciseId]?.name ?? ex.exerciseId}</AppText>
          {ex.sets.map((set) => {
            const rpe = effectiveRpe(set);
            return (
              <View key={set.id} style={styles.setRow}>
                <AppText variant="caption" color={colors.textTertiary} style={styles.setLabel}>
                  {set.isWarmup ? 'Warm-up' : `Set ${set.setNumber}`}
                </AppText>
                <AppText variant="body">
                  {formatWeight(set.weightKg, unit)} × {set.reps}
                  {rpe !== undefined ? `  @ RPE ${Math.round(rpe * 10) / 10}` : ''}
                </AppText>
                <AppText variant="caption" color={colors.warning}>
                  {[set.isFailure ? 'failure' : null, set.isDropSet ? 'drop set' : null]
                    .filter(Boolean)
                    .join(' · ')}
                </AppText>
              </View>
            );
          })}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', paddingVertical: spacing.md },
  meta: { marginVertical: spacing.md },
  card: { gap: spacing.sm, marginBottom: spacing.md },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  setLabel: { width: 64 },
});

import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { e1RmTrend, volumeTrend } from '@/domain/stats';
import { toDisplayWeight } from '@/domain/units';
import { useExerciseLibrary, useProfile, useSessions } from '@/state/queries';
import { ProgressChart } from '@/ui/components/progressChart';
import { AppText, Button, Card, Screen } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';

/** Per-exercise progression: estimated 1RM and session volume trends. */
export default function ExerciseProgress() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const router = useRouter();
  const sessions = useSessions();
  const profile = useProfile();
  const { byId } = useExerciseLibrary();

  const unit = profile.data?.unit ?? 'kg';
  const exercise = exerciseId ? byId[exerciseId] : undefined;
  const completed = sessions.data ?? [];

  const toUnit = (points: { date: string; value: number }[]) =>
    points.map((p) => ({ ...p, value: Math.round(toDisplayWeight(p.value, unit) * 10) / 10 }));

  const e1Rm = toUnit(e1RmTrend(completed, exerciseId ?? ''));
  const volume = toUnit(volumeTrend(completed, exerciseId ?? ''));

  return (
    <Screen testID="exercise-progress-screen">
      <View style={styles.header}>
        <Button label="‹ Back" variant="ghost" compact onPress={() => router.back()} />
      </View>
      <AppText variant="title">{exercise?.name ?? exerciseId}</AppText>
      <AppText variant="body" color={colors.textSecondary} style={styles.subtitle}>
        Estimated 1RM uses the Epley formula from your best set each session. It is an estimate —
        trends matter more than single points.
      </AppText>

      <Card style={styles.card} testID="progress-e1rm">
        <AppText variant="label" color={colors.textTertiary}>
          Estimated 1RM ({unit})
        </AppText>
        <ProgressChart points={e1Rm} unitLabel={`Best estimated 1RM per session (${unit})`} width={300} />
      </Card>

      <Card style={styles.card} testID="progress-volume">
        <AppText variant="label" color={colors.textTertiary}>
          Session volume ({unit})
        </AppText>
        <ProgressChart
          points={volume}
          unitLabel={`Total working volume per session (${unit})`}
          width={300}
          accentColor={colors.rest}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', paddingVertical: spacing.md },
  subtitle: { marginVertical: spacing.md, lineHeight: 22 },
  card: { gap: spacing.sm, marginBottom: spacing.lg },
});

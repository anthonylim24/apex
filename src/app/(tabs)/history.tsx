import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { consistency, sessionMinutes, sessionVolumeKg, weeklySummaries } from '@/domain/stats';
import { formatWeight } from '@/domain/units';
import { useExerciseLibrary, useProfile, useSessions } from '@/state/queries';
import { WeeklyBars } from '@/ui/components/progressChart';
import { AppText, Card, EmptyState, Screen } from '@/ui/components/primitives';
import { colors, fonts, spacing } from '@/ui/theme';

/** Progress tab: weekly dashboards, consistency, per-exercise trends,
 * and the full workout log. */
export default function History() {
  const router = useRouter();
  const sessions = useSessions();
  const profile = useProfile();
  const { byId } = useExerciseLibrary();
  const unit = profile.data?.unit ?? 'kg';

  const completed = useMemo(
    () => (sessions.data ?? []).filter((s) => s.status === 'completed'),
    [sessions.data],
  );
  const weeks = weeklySummaries(completed, byId);
  const recentWeeks = consistency(completed, 8);

  const trainedExerciseIds = useMemo(() => {
    const ids = new Map<string, number>();
    for (const session of completed) {
      for (const ex of session.exercises) {
        ids.set(ex.exerciseId, (ids.get(ex.exerciseId) ?? 0) + ex.sets.length);
      }
    }
    return [...ids.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  }, [completed]);

  if (completed.length === 0) {
    return (
      <Screen testID="history-screen">
        <AppText variant="title" style={styles.title}>
          Progress
        </AppText>
        <EmptyState
          title="No workouts yet"
          message="Finish your first workout and your volume, strength trends, and consistency will show up here."
          actionLabel="Start a workout"
          onAction={() => router.push('/workout/new')}
          testID="history-empty"
        />
      </Screen>
    );
  }

  return (
    <Screen testID="history-screen">
      <View style={styles.masthead}>
        <AppText variant="title" style={styles.title}>
          Progress
        </AppText>
        <View style={styles.titleRule} />
        <AppText variant="display" color={colors.accent}>
          {completed.length}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {completed.length === 1 ? 'Session in the log' : 'Sessions in the log'}
        </AppText>
      </View>

      <Card style={styles.heroCard} testID="history-consistency">
        <AppText variant="heading">Workouts per week</AppText>
        <WeeklyBars
          data={recentWeeks.map((w) => ({ label: w.weekStart.slice(5), value: w.workouts }))}
          width={300}
        />
      </Card>

      <View style={styles.volumeBlock} testID="history-volume">
        <AppText variant="bodyBold" color={colors.textSecondary}>
          Weekly volume ({unit})
        </AppText>
        <WeeklyBars
          data={weeks.slice(-8).map((w) => ({
            label: w.weekStart.slice(5),
            value: Math.round(w.totalVolumeKg),
          }))}
          width={300}
          barColor={colors.rest}
        />
      </View>

      <AppText variant="heading" style={styles.sectionTitle}>
        Exercise trends
      </AppText>
      <View style={styles.logList}>
        {trainedExerciseIds.slice(0, 6).map((exerciseId) => (
          <Pressable
            key={exerciseId}
            testID={`history-trend-${exerciseId}`}
            accessibilityRole="button"
            accessibilityLabel={`${byId[exerciseId]?.name ?? exerciseId} progression`}
            onPress={() => router.push(`/progress/${exerciseId}`)}
            style={({ pressed }) => [styles.logRow, pressed && styles.rowPressed]}
          >
            <AppText variant="bodyBold">{byId[exerciseId]?.name ?? exerciseId}</AppText>
            <AppText variant="caption" color={colors.accent}>
              View trend →
            </AppText>
          </Pressable>
        ))}
      </View>

      <AppText variant="heading" style={styles.sectionTitle}>
        Workout log
      </AppText>
      <View style={styles.logList}>
        {completed.map((session) => (
          <Pressable
            key={session.id}
            testID={`history-session-${session.id}`}
            accessibilityRole="button"
            accessibilityLabel={`Workout ${session.name} on ${session.startedAt.slice(0, 10)}`}
            onPress={() => router.push(`/session/${session.id}`)}
            style={({ pressed }) => [styles.sessionRow, pressed && styles.rowPressed]}
          >
            <AppText variant="caption" color={colors.accent} style={styles.sessionDate}>
              {session.startedAt.slice(0, 10)}
            </AppText>
            <View style={styles.sessionMain}>
              <AppText variant="bodyBold">{session.name}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {sessionMinutes(session)} min · {formatWeight(sessionVolumeKg(session), unit)} total
              </AppText>
            </View>
            <AppText variant="body" color={colors.textTertiary}>
              ›
            </AppText>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingTop: spacing.xl },
  masthead: { gap: spacing.sm, marginBottom: spacing.xl },
  titleRule: {
    width: 40,
    height: 2,
    backgroundColor: colors.accent,
  },
  heroCard: { gap: spacing.sm, marginBottom: spacing.xl },
  volumeBlock: { gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  logList: { gap: 0 },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceOutline,
    minHeight: 56,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceOutline,
    minHeight: 64,
    gap: spacing.md,
  },
  sessionDate: { fontFamily: fonts.display, letterSpacing: 0.5, minWidth: 88 },
  sessionMain: { flex: 1, gap: spacing.xs },
  rowPressed: { backgroundColor: colors.surfacePressed },
});

import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { weeklySummaries } from '@/domain/stats';
import { formatWeight } from '@/domain/units';
import { useSessionStore } from '@/state/sessionStore';
import { useExerciseLibrary, useProfile, useSessions } from '@/state/queries';
import { AppText, Button, Card, Screen } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';

/** Home ("Train") — one glance: start training, this week, last workout. */
export default function Home() {
  const router = useRouter();
  const profile = useProfile();
  const sessions = useSessions();
  const { byId } = useExerciseLibrary();
  const liveSession = useSessionStore((s) => s.session);

  const unit = profile.data?.unit ?? 'kg';
  const completed = (sessions.data ?? []).filter((s) => s.status === 'completed');
  const weeks = weeklySummaries(completed, byId);
  const thisWeek = weeks[weeks.length - 1];
  const lastSession = completed[0];

  return (
    <Screen testID="home-screen">
      <View style={styles.header}>
        <AppText variant="title" testID="home-greeting">
          {profile.data?.displayName ? `Ready, ${profile.data.displayName}?` : 'Ready to train?'}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {profile.data
            ? `${profile.data.goal} · ${profile.data.preferredSessionMinutes} min sessions`
            : 'Set up your profile to get personalized workouts.'}
        </AppText>
      </View>

      {liveSession && liveSession.status === 'active' ? (
        <Card style={styles.resumeCard} testID="home-resume">
          <AppText variant="bodyBold" color={colors.active}>
            Workout in progress
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {liveSession.name}
          </AppText>
          <Button
            label="Resume workout"
            onPress={() => router.push('/workout/player')}
            testID="home-resume-button"
          />
        </Card>
      ) : (
        <Button
          label="Start a workout"
          onPress={() => router.push('/workout/new')}
          style={styles.startButton}
          testID="home-start-workout"
          accessibilityHint="Choose a generated or manual workout"
        />
      )}

      <Card style={styles.card} testID="home-weekly-summary">
        <AppText variant="label" color={colors.textTertiary}>
          This week
        </AppText>
        <View style={styles.statRow}>
          <Stat label="Workouts" value={String(thisWeek?.workouts ?? 0)} />
          <Stat label="Minutes" value={String(thisWeek?.minutes ?? 0)} />
          <Stat
            label="Volume"
            value={thisWeek ? formatWeight(thisWeek.totalVolumeKg, unit) : `0 ${unit}`}
          />
        </View>
      </Card>

      {lastSession ? (
        <Card style={styles.card} testID="home-last-workout">
          <AppText variant="label" color={colors.textTertiary}>
            Last workout
          </AppText>
          <AppText variant="bodyBold">{lastSession.name}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {lastSession.startedAt.slice(0, 10)} ·{' '}
            {lastSession.exercises.reduce((n, ex) => n + ex.sets.length, 0)} sets
          </AppText>
          <Button
            label="View details"
            variant="secondary"
            compact
            onPress={() => router.push(`/session/${lastSession.id}`)}
            testID="home-last-workout-details"
          />
        </Card>
      ) : (
        <Card style={styles.card}>
          <AppText variant="bodyBold">Your first workout is one tap away</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Generate a science-based plan from your profile, or build your own from the exercise
            library. Everything works offline.
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.stat}>
    <AppText variant="heading" color={colors.accent}>
      {value}
    </AppText>
    <AppText variant="caption" color={colors.textSecondary}>
      {label}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  header: { paddingVertical: spacing.xl, gap: spacing.xs },
  startButton: { minHeight: 72, marginBottom: spacing.lg },
  resumeCard: { gap: spacing.md, marginBottom: spacing.lg, borderColor: colors.active },
  card: { gap: spacing.sm, marginBottom: spacing.lg },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  stat: { alignItems: 'center', flex: 1, gap: spacing.xs },
});

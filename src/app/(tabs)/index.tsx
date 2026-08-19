import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { weeklySummaries } from '@/domain/stats';
import { formatWeight } from '@/domain/units';
import { useSessionStore } from '@/state/sessionStore';
import { useExerciseLibrary, useProfile, useSessions } from '@/state/queries';
import { coachNoteForDate, greetingForHour } from '@/ui/coachVoice';
import { AppText, Button, Card, Screen } from '@/ui/components/primitives';
import { ApexMark, ApexWordmark } from '@/ui/components/wordmark';
import { colors, radius, spacing } from '@/ui/theme';

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

  const greeting = profile.data?.displayName
    ? `Ready, ${profile.data.displayName}?`
    : greetingForHour(new Date().getHours());

  const workouts = thisWeek?.workouts ?? 0;
  const minutes = thisWeek?.minutes ?? 0;
  const volumeText = thisWeek ? formatWeight(thisWeek.totalVolumeKg, unit) : `0 ${unit}`;
  const leadWithVolume = (thisWeek?.totalVolumeKg ?? 0) > 0;

  return (
    <Screen testID="home-screen">
      <View style={styles.header}>
        <View style={styles.markTexture} pointerEvents="none" accessibilityElementsHidden>
          <ApexMark size={260} />
        </View>
        <ApexWordmark />
        <AppText variant="display" testID="home-greeting">
          {greeting}
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

      <Card style={styles.weekCard} testID="home-weekly-summary">
        <AppText variant="display" color={colors.accent} style={styles.weekFigure}>
          {leadWithVolume ? volumeText : String(workouts)}
        </AppText>
        <AppText variant="body" color={colors.textSecondary}>
          {leadWithVolume ? 'Volume · This week' : 'Workouts · This week'}
        </AppText>
        <View style={styles.weekSupport}>
          {leadWithVolume ? (
            <>
              <AppText variant="heading">{workouts}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {' '}
                workouts
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {'  ·  '}
              </AppText>
              <AppText variant="heading">{minutes}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {' '}
                min
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="heading">{minutes}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {' '}
                min
              </AppText>
              <AppText variant="caption" color={colors.textTertiary}>
                {'  ·  '}
              </AppText>
              <AppText variant="heading">{volumeText}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {' '}
                volume
              </AppText>
            </>
          )}
        </View>
      </Card>

      <View style={styles.coachChip} testID="home-coach-note">
        <AppText variant="body" color={colors.textSecondary} style={styles.coachText}>
          <AppText variant="bodyBold" color={colors.text}>
            {'Coach\u2019s note. '}
          </AppText>
          {coachNoteForDate()}
        </AppText>
      </View>

      {lastSession ? (
        <Card style={styles.lastCard} testID="home-last-workout">
          <AppText variant="heading">{lastSession.name}</AppText>
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
        <Card style={styles.lastCard}>
          <AppText variant="heading">Your first workout is one tap away</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Generate a science-based plan from your profile, or build your own from the exercise
            library. Everything works offline.
          </AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    minHeight: 176,
  },
  markTexture: {
    position: 'absolute',
    right: -28,
    top: -12,
    opacity: 0.04,
  },
  startButton: { minHeight: 72, marginBottom: spacing.lg },
  resumeCard: { gap: spacing.md, marginBottom: spacing.lg, borderColor: colors.active },
  weekCard: { gap: spacing.sm, marginBottom: spacing.lg },
  weekFigure: { letterSpacing: 0.5 },
  weekSupport: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs },
  coachChip: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  coachText: { lineHeight: 22 },
  lastCard: { gap: spacing.sm, marginBottom: spacing.lg },
});

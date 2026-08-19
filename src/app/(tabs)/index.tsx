import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { weeklySummaries } from '@/domain/stats';
import { formatWeight } from '@/domain/units';
import { useSessionStore } from '@/state/sessionStore';
import { useExerciseLibrary, useProfile, useSessions } from '@/state/queries';
import { coachNoteForDate, greetingForHour } from '@/ui/coachVoice';
import { Callout, PoufIdle } from '@/ui/components/poufKit';
import { AppText, Blob, Button, Card, Screen, Stat } from '@/ui/components/primitives';
import { ApexMark, ApexWordmark } from '@/ui/components/wordmark';
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
        <View style={styles.blobRow} pointerEvents="none">
          <PoufIdle size={64} />
          <Blob tone="pink" size={36} bounce delay={0} />
          <Blob tone="mint" size={28} bounce delay={180} />
          <Blob tone="yellow" size={22} bounce delay={320} />
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

      <View style={styles.weekRow} testID="home-weekly-summary">
        <View style={styles.weekLead}>
          <Stat
            label={leadWithVolume ? 'Volume · This week' : 'Workouts · This week'}
            value={leadWithVolume ? volumeText : String(workouts)}
            tone="mint"
          />
        </View>
        <View style={styles.weekSupportCol}>
          <Stat label="min" value={String(minutes)} tone="blue" />
          {leadWithVolume ? (
            <AppText variant="caption" color={colors.textSecondary} style={styles.weekAside}>
              {workouts} workouts
            </AppText>
          ) : (
            <AppText variant="caption" color={colors.textSecondary} style={styles.weekAside}>
              {volumeText} volume
            </AppText>
          )}
        </View>
      </View>

      <Callout tone="yellow" title="Coach's note" testID="home-coach-note" style={styles.coach}>
        {coachNoteForDate()}
      </Callout>

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
    opacity: 0.08,
  },
  blobRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  weekRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  weekLead: { flex: 1.4 },
  weekSupportCol: { flex: 1, gap: spacing.sm },
  weekAside: { paddingHorizontal: spacing.sm },
  startButton: { minHeight: 72, marginBottom: spacing.lg },
  resumeCard: { gap: spacing.md, marginBottom: spacing.lg, borderColor: colors.active },
  weekCard: { gap: spacing.sm, marginBottom: spacing.lg },
  weekFigure: { letterSpacing: 0.5 },
  weekSupport: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.xs },
  coach: { marginBottom: spacing.lg },
  lastCard: { gap: spacing.sm, marginBottom: spacing.lg },
});

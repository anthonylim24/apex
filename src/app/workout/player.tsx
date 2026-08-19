import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lastPerformance, performanceHistory } from '@/domain/history';
import { suggestProgression } from '@/domain/progression';
import { smallestIncrement } from '@/domain/units';
import { cancelRestEndNotification, scheduleRestEndNotification } from '@/services/restNotifications';
import { useSessionStore } from '@/state/sessionStore';
import { useExerciseLibrary, useProfile, useSaveSession, useSessions } from '@/state/queries';
import { restEncouragement } from '@/ui/coachVoice';
import { PrCelebration } from '@/ui/components/prCelebration';
import { Callout, ProgressPips } from '@/ui/components/poufKit';
import { AppText, Button } from '@/ui/components/primitives';
import { RestTimerOverlay } from '@/ui/components/restTimer';
import { SetLogger } from '@/ui/components/setLogger';
import { colors, spacing } from '@/ui/theme';

/**
 * Live Workout Player — the highest-priority surface.
 *
 * - Keep-awake, dark, high-contrast, one-handed (all controls in the
 *   lower two-thirds, >= 56-64pt targets).
 * - Previous performance and the progression suggestion are always
 *   visible; suggestions explain *why* and are never auto-applied.
 * - Every set is persisted locally the moment it is logged: killing the
 *   app or losing signal mid-workout loses nothing.
 * - Rest timer with haptics + local notification; adjustable and
 *   skippable at any time.
 */
export default function WorkoutPlayer() {
  useKeepAwake();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const sessions = useSessions();
  const { byId } = useExerciseLibrary();
  const saveSession = useSaveSession();

  const session = useSessionStore((s) => s.session);
  const exerciseIndex = useSessionStore((s) => s.exerciseIndex);
  const draft = useSessionStore((s) => s.draft);
  const restEndsAt = useSessionStore((s) => s.restEndsAt);
  const restTotalSeconds = useSessionStore((s) => s.restTotalSeconds);
  const pendingPrs = useSessionStore((s) => s.pendingPrs);
  const store = useSessionStore;

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [finished, setFinished] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const unit = profile.data?.unit ?? 'kg';
  const effortMode = 'rpe' as const;
  const priorSessions = useMemo(
    () => (sessions.data ?? []).filter((s) => s.id !== session?.id),
    [sessions.data, session?.id],
  );

  const currentExercise = session?.exercises[exerciseIndex];
  const exerciseInfo = currentExercise ? byId[currentExercise.exerciseId] : undefined;

  const lastSets = useMemo(
    () => (currentExercise ? lastPerformance(priorSessions, currentExercise.exerciseId) : []),
    [priorSessions, currentExercise],
  );

  const suggestion = useMemo(() => {
    if (!currentExercise || !exerciseInfo) return undefined;
    return suggestProgression({
      exercise: exerciseInfo,
      prescription: currentExercise,
      lastSets,
      history: performanceHistory(priorSessions, currentExercise.exerciseId, currentExercise),
      unit,
    });
  }, [currentExercise, exerciseInfo, lastSets, priorSessions, unit]);

  // Rest timer tick + haptic on completion.
  const resting = restEndsAt !== undefined && restEndsAt > nowMs;
  useEffect(() => {
    if (restEndsAt === undefined) return;
    const interval = setInterval(() => setNowMs(Date.now()), 250);
    return () => clearInterval(interval);
  }, [restEndsAt]);
  useEffect(() => {
    if (restEndsAt !== undefined && restEndsAt <= nowMs) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      store.getState().skipRest();
    }
  }, [restEndsAt, nowMs, store]);

  if (!session || !currentExercise) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]} testID="player-screen">
        <LinearGradient
          colors={[colors.bgTop, colors.bg]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.screenLight}
          pointerEvents="none"
        />
        <AppText variant="heading">No active workout</AppText>
        <Button label="Back home" onPress={() => router.replace('/(tabs)')} />
      </View>
    );
  }

  const workingSets = currentExercise.sets.filter((s) => !s.isWarmup);
  const nextExercise = session.exercises[exerciseIndex + 1];

  const handleLog = (): void => {
    const updated = store.getState().logSet();
    if (updated) saveSession.mutate(updated);
    const rest = store.getState().restTotalSeconds;
    if (rest > 0) void scheduleRestEndNotification(rest);
  };

  const goToExercise = (index: number): void => {
    const target = session.exercises[index];
    if (!target) return;
    store.getState().selectExercise(index, lastPerformance(priorSessions, target.exerciseId));
  };

  /** Pop back to the original tabs entry instead of stacking a second
   * tabs navigator (duplicate mounted screens otherwise). */
  const exitTo = (path: '/(tabs)' | '/(tabs)/history'): void => {
    if (router.canDismiss()) router.dismissAll();
    router.replace(path);
  };

  const handleFinish = (): void => {
    const completed = store.getState().finish(priorSessions);
    if (completed) saveSession.mutate(completed);
    void cancelRestEndNotification();
    setFinished(true);
    if (store.getState().pendingPrs.length === 0) {
      store.getState().reset();
      exitTo('/(tabs)/history');
    }
  };

  const handleDiscard = (): void => {
    const discarded = store.getState().discard();
    if (discarded) saveSession.mutate(discarded);
    void cancelRestEndNotification();
    exitTo('/(tabs)');
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + spacing.md }]} testID="player-screen">
      <LinearGradient
        colors={[colors.bgTop, colors.bg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.screenLight}
        pointerEvents="none"
      />
      <View style={styles.padded}>
        <View style={styles.headerBlock}>
          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Exercise ${exerciseIndex + 1} of ${session.exercises.length}`}
            accessibilityValue={{
              min: 1,
              max: session.exercises.length,
              now: exerciseIndex + 1,
            }}
          >
            <ProgressPips total={session.exercises.length} current={exerciseIndex} />
          </View>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText
                variant="title"
                numberOfLines={1}
                adjustsFontSizeToFit
                testID="player-exercise-name"
              >
                {exerciseInfo?.name ?? currentExercise.exerciseId}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} testID="player-set-progress">
                {workingSets.length} of {currentExercise.targetSets} sets ·{' '}
                {currentExercise.targetRepsMin}-{currentExercise.targetRepsMax} reps target
              </AppText>
            </View>
            <Button
              label="Finish"
              variant="secondary"
              compact
              onPress={handleFinish}
              testID="player-finish"
              accessibilityHint="Completes and saves this workout"
            />
          </View>
        </View>

        {suggestion && suggestion.action !== 'hold' && lastSets.length > 0 ? (
          <Callout tone="mint" testID="player-suggestion" style={styles.suggestion}>
            {suggestion.rationale}
          </Callout>
        ) : null}

        <View style={styles.body}>
          {resting ? (
            <RestTimerOverlay
              secondsRemaining={(restEndsAt - nowMs) / 1000}
              totalSeconds={restTotalSeconds}
              encouragement={restEncouragement(workingSets.length)}
              nextUp={
                workingSets.length >= currentExercise.targetSets && nextExercise
                  ? byId[nextExercise.exerciseId]?.name
                  : `Set ${workingSets.length + 1} · ${exerciseInfo?.name ?? ''}`
              }
              onAdjust={(delta) => {
                store.getState().adjustRest(delta);
                const remaining = (store.getState().restEndsAt ?? Date.now()) - Date.now();
                void scheduleRestEndNotification(remaining / 1000);
              }}
              onSkip={() => {
                store.getState().skipRest();
                void cancelRestEndNotification();
              }}
            />
          ) : (
            <SetLogger
              setNumber={workingSets.length + 1}
              draft={draft}
              previous={lastSets.filter((s) => !s.isWarmup)[workingSets.length] ?? lastSets.filter((s) => !s.isWarmup)[0]}
              unit={unit}
              effortMode={effortMode}
              weightStep={smallestIncrement(exerciseInfo?.equipment ?? ['barbell'], unit)}
              onChange={(d) => store.getState().setDraft(d)}
              onLog={handleLog}
            />
          )}
        </View>

        {/* Footer navigation — thumb zone */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            label="‹ Prev"
            variant="secondary"
            onPress={() => goToExercise(exerciseIndex - 1)}
            disabled={exerciseIndex === 0}
            style={styles.footerButton}
            testID="player-prev-exercise"
          />
          <Button
            label={confirmDiscard ? 'Really discard?' : 'Discard'}
            variant="danger"
            onPress={() => (confirmDiscard ? handleDiscard() : setConfirmDiscard(true))}
            style={styles.footerButton}
            testID="player-discard"
            accessibilityHint={confirmDiscard ? 'Tap again to permanently discard this workout' : 'Tap twice to discard this workout'}
          />
          <Button
            label="Next ›"
            variant="secondary"
            onPress={() => goToExercise(exerciseIndex + 1)}
            disabled={exerciseIndex >= session.exercises.length - 1}
            style={styles.footerButton}
            testID="player-next-exercise"
          />
        </View>
      </View>

      {finished && pendingPrs.length > 0 ? (
        <PrCelebration
          records={pendingPrs}
          exerciseNames={Object.fromEntries(
            Object.values(byId).map((e) => [e.id, e.name]),
          )}
          unit={unit}
          onDismiss={() => {
            store.getState().dismissPrs();
            store.getState().reset();
            exitTo('/(tabs)/history');
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  padded: { flex: 1, paddingHorizontal: spacing.lg },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerBlock: { marginBottom: spacing.md, gap: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  suggestion: { marginBottom: spacing.md },
  body: { flex: 1, justifyContent: 'flex-end' },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    alignItems: 'flex-end',
  },
  footerButton: { flex: 1 },
});

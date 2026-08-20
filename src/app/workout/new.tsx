import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { generateWorkout, schemeForGoal, type SessionIntensity } from '@/domain/generation';
import { bestE1RmByExercise, weeklySetsPerMuscle } from '@/domain/history';
import { searchExercises } from '@/domain/exerciseSearch';
import type { Exercise, SessionExercise, WorkoutSession } from '@/domain/types';
import { formatWeight } from '@/domain/units';
import { useSessionStore } from '@/state/sessionStore';
import { useExerciseLibrary, useProfile, useSaveSession, useSessions } from '@/state/queries';
import { FieldInput } from '@/ui/components/poufKit';
import { AppText, Button, Card, Screen, SegmentedControl } from '@/ui/components/primitives';
import { colors, spacing } from '@/ui/theme';

type Mode = 'generate' | 'manual';

let sessionCounter = 0;
const newSessionId = (): string =>
  `session-${Date.now().toString(36)}-${(sessionCounter += 1).toString(36)}`;

/**
 * Workout builder: science-based generation from the profile, or a
 * manual pick from the library. Both produce the same session shape and
 * flow into the same Live Workout Player.
 */
export default function NewWorkout() {
  const router = useRouter();
  const profile = useProfile();
  const sessions = useSessions();
  const { exercises: library, byId } = useExerciseLibrary();
  const saveSession = useSaveSession();
  const startLive = useSessionStore((s) => s.start);

  const [mode, setMode] = useState<Mode>('generate');
  const [intensity, setIntensity] = useState<SessionIntensity>('moderate');
  const [generationSeed, setGenerationSeed] = useState(0);
  const [manualPicks, setManualPicks] = useState<Exercise[]>([]);
  const [query, setQuery] = useState('');

  const p = profile.data;
  const completed = useMemo(
    () => (sessions.data ?? []).filter((s) => s.status === 'completed'),
    [sessions.data],
  );

  const generated = useMemo(() => {
    if (!p || mode !== 'generate') return undefined;
    // Simple seeded RNG so "Regenerate" gives a new-but-stable plan.
    let state = generationSeed * 1103515245 + 12345;
    const random = (): number => {
      state = (state * 1103515245 + 12345) % 2147483648;
      return state / 2147483648;
    };
    return generateWorkout({
      profile: p,
      library,
      e1RmByExercise: bestE1RmByExercise(completed),
      weeklySetsPerMuscle: weeklySetsPerMuscle(completed, byId),
      intensity,
      random,
    });
  }, [p, mode, intensity, generationSeed, library, completed, byId]);

  const searchResults = useMemo(
    () =>
      query.trim().length > 0
        ? searchExercises(library, { query }).slice(0, 6)
        : [],
    [library, query],
  );

  const buildManualExercises = (): SessionExercise[] => {
    if (!p) return [];
    const scheme = schemeForGoal(p.goal);
    const e1Rms = bestE1RmByExercise(completed);
    return manualPicks.map((exercise, index) => ({
      id: `manual-${Date.now().toString(36)}-${index}`,
      exerciseId: exercise.id,
      order: index,
      targetSets: scheme.sets,
      targetRepsMin: scheme.repsMin,
      targetRepsMax: scheme.repsMax,
      targetWeightKg: e1Rms[exercise.id]
        ? Math.round((e1Rms[exercise.id] / (1 + (scheme.repsMax + 2) / 30)) * 10) / 10
        : undefined,
      restSeconds: scheme.restSeconds,
      sets: [],
    }));
  };

  const start = async (): Promise<void> => {
    if (!p) return;
    const exercises = mode === 'generate' ? (generated?.exercises ?? []) : buildManualExercises();
    if (exercises.length === 0) return;
    const nowIso = new Date().toISOString();
    const session: WorkoutSession = {
      id: newSessionId(),
      userId: p.userId,
      name: mode === 'generate' ? (generated?.name ?? 'Workout') : 'Custom workout',
      status: 'active',
      startedAt: nowIso,
      exercises,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    startLive(session);
    await saveSession.mutateAsync(session);
    router.replace('/workout/player');
  };

  if (!p) {
    return (
      <Screen testID="new-workout-screen">
        <AppText variant="title">Set up your profile first</AppText>
        <AppText variant="body" color={colors.textSecondary}>
          Workout generation uses your goal, equipment, and experience.
        </AppText>
        <Button label="Go to onboarding" onPress={() => router.replace('/onboarding')} />
      </Screen>
    );
  }

  return (
    <Screen testID="new-workout-screen">
      <View style={styles.header}>
        <Button label="‹ Back" variant="ghost" compact onPress={() => router.back()} testID="new-workout-back" />
      </View>
      <AppText variant="title">New workout</AppText>

      <SegmentedControl<Mode>
        options={[
          { value: 'generate', label: 'Generate for me' },
          { value: 'manual', label: 'Build my own' },
        ]}
        value={mode}
        onChange={setMode}
        testID="new-workout-mode"
      />

      {mode === 'generate' ? (
        <View style={styles.section}>
          <AppText variant="label" color={colors.textTertiary}>
            Session intensity (daily undulating)
          </AppText>
          <SegmentedControl<SessionIntensity>
            options={[
              { value: 'light', label: 'Light' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'heavy', label: 'Heavy' },
            ]}
            value={intensity}
            onChange={setIntensity}
            testID="new-workout-intensity"
          />
          {generated ? (
            <Card style={styles.planCard} testID="generated-plan">
              <AppText variant="title">{generated.name}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                ~{generated.estimatedMinutes} min · {generated.exercises.length} exercises · fits
                your {p.preferredSessionMinutes}-minute preference
              </AppText>
              {generated.exercises.map((ex) => (
                <View key={ex.id} style={styles.planRow}>
                  <AppText variant="body" style={styles.planName}>
                    {byId[ex.exerciseId]?.name ?? ex.exerciseId}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {ex.targetSets} × {ex.targetRepsMin}-{ex.targetRepsMax}
                    {ex.targetWeightKg ? ` @ ${formatWeight(ex.targetWeightKg, p.unit)}` : ''}
                  </AppText>
                </View>
              ))}
              <AppText variant="caption" color={colors.textTertiary}>
                Built from your goal, equipment, recent weekly volume, and past performance.
                You stay in control — swap anything mid-workout.
              </AppText>
            </Card>
          ) : null}
          <Button
            label="Regenerate"
            variant="secondary"
            onPress={() => setGenerationSeed((s) => s + 1)}
            testID="new-workout-regenerate"
          />
        </View>
      ) : (
        <View style={styles.section}>
          <FieldInput
            testID="manual-search"
            style={styles.input}
            placeholder="Search exercises to add…"
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search exercises to add"
          />
          {searchResults.map((exercise) => (
            <Button
              key={exercise.id}
              label={`+ ${exercise.name}`}
              variant="secondary"
              compact
              onPress={() => {
                if (!manualPicks.some((e) => e.id === exercise.id)) {
                  setManualPicks((prev) => [...prev, exercise]);
                }
                setQuery('');
              }}
              testID={`manual-add-${exercise.id}`}
            />
          ))}
          {manualPicks.length > 0 ? (
            <Card style={styles.planCard} testID="manual-plan">
              <AppText variant="bodyBold">Your workout ({manualPicks.length} exercises)</AppText>
              {manualPicks.map((exercise) => (
                <View key={exercise.id} style={styles.planRow}>
                  <AppText variant="body" style={styles.planName}>
                    {exercise.name}
                  </AppText>
                  <Button
                    label="Remove"
                    variant="ghost"
                    compact
                    onPress={() => setManualPicks((prev) => prev.filter((e) => e.id !== exercise.id))}
                    testID={`manual-remove-${exercise.id}`}
                  />
                </View>
              ))}
            </Card>
          ) : (
            <AppText variant="caption" color={colors.textTertiary}>
              Add exercises above. Set/rep targets default to your goal ({schemeForGoal(p.goal).sets}
              ×{schemeForGoal(p.goal).repsMin}-{schemeForGoal(p.goal).repsMax}) and are adjustable
              during the workout.
            </AppText>
          )}
        </View>
      )}

      <Button
        label="Start workout"
        onPress={() => void start()}
        disabled={mode === 'generate' ? !generated || generated.exercises.length === 0 : manualPicks.length === 0}
        loading={saveSession.isPending}
        style={styles.startButton}
        testID="new-workout-start"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', paddingVertical: spacing.md },
  section: { gap: spacing.md, marginTop: spacing.lg },
  planCard: { gap: spacing.sm },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planName: { flex: 1 },
  input: { minHeight: 56 },
  startButton: { marginTop: spacing.xl, minHeight: 72 },
});

import { buildSessionPerformance, type SessionPerformance } from './progression';
import { epley1Rm } from './oneRepMax';
import type { Exercise, MuscleGroup, SetLog, SessionExercise, WorkoutSession } from './types';

/** Completed sessions containing `exerciseId`, oldest first. */
const completedWith = (sessions: WorkoutSession[], exerciseId: string): WorkoutSession[] =>
  sessions
    .filter(
      (s) =>
        s.status === 'completed' &&
        s.exercises.some((ex) => ex.exerciseId === exerciseId && ex.sets.length > 0),
    )
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));

const setsFor = (session: WorkoutSession, exerciseId: string): SetLog[] =>
  session.exercises
    .filter((ex) => ex.exerciseId === exerciseId)
    .flatMap((ex) => ex.sets);

/** Working sets from the most recent session containing this exercise. */
export const lastPerformance = (
  sessions: WorkoutSession[],
  exerciseId: string,
): SetLog[] => {
  const history = completedWith(sessions, exerciseId);
  const latest = history[history.length - 1];
  return latest ? setsFor(latest, exerciseId) : [];
};

/** Per-session performance snapshots for the progression engine. */
export const performanceHistory = (
  sessions: WorkoutSession[],
  exerciseId: string,
  prescription: Pick<SessionExercise, 'targetSets' | 'targetRepsMin' | 'targetRepsMax'>,
): SessionPerformance[] =>
  completedWith(sessions, exerciseId).map((session) =>
    buildSessionPerformance(
      setsFor(session, exerciseId),
      prescription,
      session.startedAt.slice(0, 10),
    ),
  );

/** Best estimated 1RM per exercise across all history (for generation). */
export const bestE1RmByExercise = (sessions: WorkoutSession[]): Record<string, number> => {
  const best: Record<string, number> = {};
  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (set.isWarmup) continue;
        const e1Rm = epley1Rm(set.weightKg, set.reps);
        if (e1Rm > (best[ex.exerciseId] ?? 0)) best[ex.exerciseId] = e1Rm;
      }
    }
  }
  return best;
};

/** Hard sets per muscle over the trailing 7 days (volume landmarks). */
export const weeklySetsPerMuscle = (
  sessions: WorkoutSession[],
  exercisesById: Record<string, Exercise>,
  now: Date = new Date(),
): Partial<Record<MuscleGroup, number>> => {
  const cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  const result: Partial<Record<MuscleGroup, number>> = {};
  for (const session of sessions) {
    if (session.status !== 'completed' || session.startedAt < cutoff) continue;
    for (const ex of session.exercises) {
      const exercise = exercisesById[ex.exerciseId];
      if (!exercise) continue;
      const hardSets = ex.sets.filter((s) => !s.isWarmup).length;
      for (const muscle of exercise.primaryMuscles) {
        result[muscle] = (result[muscle] ?? 0) + hardSets;
      }
    }
  }
  return result;
};

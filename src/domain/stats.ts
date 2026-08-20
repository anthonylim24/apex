import { epley1Rm } from './oneRepMax';
import type {
  Exercise,
  MuscleGroup,
  PersonalRecord,
  SetLog,
  WeeklySummary,
  WorkoutSession,
} from './types';

/** Total mechanical volume (kg lifted) across working sets. */
export const sessionVolumeKg = (session: WorkoutSession): number =>
  session.exercises.reduce(
    (total, ex) =>
      total +
      ex.sets.filter((s) => !s.isWarmup).reduce((sum, s) => sum + s.weightKg * s.reps, 0),
    0,
  );

export const sessionMinutes = (session: WorkoutSession): number => {
  if (!session.completedAt) return 0;
  const ms = new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime();
  return Math.max(0, Math.round(ms / 60000));
};

/** ISO date (yyyy-mm-dd) of the Monday of the week containing `date`. */
export const weekStartOf = (date: string): string => {
  const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
};

/** Hard (non-warm-up) sets per primary muscle for a session. */
export const setsPerMuscle = (
  session: WorkoutSession,
  exercisesById: Record<string, Exercise>,
): Partial<Record<MuscleGroup, number>> => {
  const result: Partial<Record<MuscleGroup, number>> = {};
  for (const ex of session.exercises) {
    const exercise = exercisesById[ex.exerciseId];
    if (!exercise) continue;
    const hardSets = ex.sets.filter((s) => !s.isWarmup).length;
    for (const muscle of exercise.primaryMuscles) {
      result[muscle] = (result[muscle] ?? 0) + hardSets;
    }
  }
  return result;
};

export const weeklySummaries = (
  sessions: WorkoutSession[],
  exercisesById: Record<string, Exercise>,
): WeeklySummary[] => {
  const completed = sessions.filter((s) => s.status === 'completed');
  const byWeek = new Map<string, WeeklySummary>();
  for (const session of completed) {
    const weekStart = weekStartOf(session.startedAt);
    const summary = byWeek.get(weekStart) ?? {
      weekStart,
      workouts: 0,
      minutes: 0,
      totalVolumeKg: 0,
      setsPerMuscle: {},
    };
    summary.workouts += 1;
    summary.minutes += sessionMinutes(session);
    summary.totalVolumeKg += sessionVolumeKg(session);
    const muscles = setsPerMuscle(session, exercisesById);
    for (const [muscle, sets] of Object.entries(muscles)) {
      const key = muscle as MuscleGroup;
      summary.setsPerMuscle[key] = (summary.setsPerMuscle[key] ?? 0) + (sets ?? 0);
    }
    byWeek.set(weekStart, summary);
  }
  return [...byWeek.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
};

export interface TrendPoint {
  date: string;
  value: number;
}

/** Best estimated 1RM per session for one exercise, oldest first. */
export const e1RmTrend = (sessions: WorkoutSession[], exerciseId: string): TrendPoint[] =>
  sessions
    .filter((s) => s.status === 'completed')
    .map((session) => {
      const sets = session.exercises
        .filter((ex) => ex.exerciseId === exerciseId)
        .flatMap((ex) => ex.sets.filter((s) => !s.isWarmup));
      const best = sets.reduce((max, s) => Math.max(max, epley1Rm(s.weightKg, s.reps)), 0);
      return { date: session.startedAt.slice(0, 10), value: best };
    })
    .filter((p) => p.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

/** Session volume trend for one exercise, oldest first. */
export const volumeTrend = (sessions: WorkoutSession[], exerciseId: string): TrendPoint[] =>
  sessions
    .filter((s) => s.status === 'completed')
    .map((session) => {
      const volume = session.exercises
        .filter((ex) => ex.exerciseId === exerciseId)
        .flatMap((ex) => ex.sets.filter((s) => !s.isWarmup))
        .reduce((sum, s) => sum + s.weightKg * s.reps, 0);
      return { date: session.startedAt.slice(0, 10), value: volume };
    })
    .filter((p) => p.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

/**
 * Detect new personal records set within `session` compared to all prior
 * completed sessions. Checks heaviest weight and best estimated 1RM.
 */
export const detectNewPrs = (
  session: WorkoutSession,
  priorSessions: WorkoutSession[],
): PersonalRecord[] => {
  const prs: PersonalRecord[] = [];
  const priorSetsFor = (exerciseId: string): SetLog[] =>
    priorSessions
      .filter((s) => s.status === 'completed' && s.id !== session.id)
      .flatMap((s) => s.exercises.filter((ex) => ex.exerciseId === exerciseId))
      .flatMap((ex) => ex.sets.filter((set) => !set.isWarmup));

  for (const ex of session.exercises) {
    const currentSets = ex.sets.filter((s) => !s.isWarmup && s.reps > 0 && s.weightKg > 0);
    if (currentSets.length === 0) continue;
    const prior = priorSetsFor(ex.exerciseId);
    const priorBestWeight = prior.reduce((max, s) => Math.max(max, s.weightKg), 0);
    const priorBestE1Rm = prior.reduce((max, s) => Math.max(max, epley1Rm(s.weightKg, s.reps)), 0);

    const bestWeightSet = currentSets.reduce((a, b) => (b.weightKg > a.weightKg ? b : a));
    if (prior.length > 0 && bestWeightSet.weightKg > priorBestWeight) {
      prs.push({
        exerciseId: ex.exerciseId,
        kind: 'weight',
        valueKg: bestWeightSet.weightKg,
        reps: bestWeightSet.reps,
        achievedAt: bestWeightSet.completedAt,
        sessionId: session.id,
      });
    }

    const bestE1RmSet = currentSets.reduce((a, b) =>
      epley1Rm(b.weightKg, b.reps) > epley1Rm(a.weightKg, a.reps) ? b : a,
    );
    const currentBestE1Rm = epley1Rm(bestE1RmSet.weightKg, bestE1RmSet.reps);
    if (prior.length > 0 && currentBestE1Rm > priorBestE1Rm) {
      prs.push({
        exerciseId: ex.exerciseId,
        kind: 'estimated_1rm',
        valueKg: currentBestE1Rm,
        reps: bestE1RmSet.reps,
        achievedAt: bestE1RmSet.completedAt,
        sessionId: session.id,
      });
    }
  }
  return prs;
};

/** Trailing consistency: completed workouts in each of the last `weeks`. */
export const consistency = (
  sessions: WorkoutSession[],
  weeks: number,
  now: Date = new Date(),
): { weekStart: string; workouts: number }[] => {
  const result: { weekStart: string; workouts: number }[] = [];
  const currentWeekStart = weekStartOf(now.toISOString());
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const d = new Date(`${currentWeekStart}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - i * 7);
    const weekStart = d.toISOString().slice(0, 10);
    const workouts = sessions.filter(
      (s) => s.status === 'completed' && weekStartOf(s.startedAt) === weekStart,
    ).length;
    result.push({ weekStart, workouts });
  }
  return result;
};

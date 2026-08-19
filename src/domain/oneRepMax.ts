import type { SetLog } from './types';

/**
 * Estimated one-rep max using the Epley formula: 1RM = w * (1 + reps/30).
 *
 * Epley is well-validated for 2-10 reps; accuracy degrades sharply past
 * ~12 reps, so we cap the rep input at 12 to avoid inflated estimates
 * from high-rep sets. A 1-rep set is by definition the lifted weight.
 */
export const epley1Rm = (weightKg: number, reps: number): number => {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  const cappedReps = Math.min(reps, 12);
  return weightKg * (1 + cappedReps / 30);
};

/** Best (highest) estimated 1RM across a list of working sets. */
export const bestSessionE1Rm = (sets: SetLog[]): number =>
  sets
    .filter((s) => !s.isWarmup)
    .reduce((best, s) => Math.max(best, epley1Rm(s.weightKg, s.reps)), 0);

/**
 * Suggest a working weight for a target rep count from a known e1RM,
 * by inverting Epley. Unlike estimation, the inversion is deliberately
 * uncapped: extrapolating past 12 reps only prescribes a *lighter*
 * weight, which errs on the safe side for high-rep work.
 */
export const weightForReps = (e1RmKg: number, reps: number): number => {
  if (e1RmKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return e1RmKg;
  return e1RmKg / (1 + reps / 30);
};

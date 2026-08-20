/**
 * RPE (rating of perceived exertion, 1-10) and RIR (reps in reserve) are
 * two views of the same effort scale: RPE 10 = 0 RIR (nothing left),
 * RPE 9 = 1 RIR, RPE 8 = 2 RIR, and so on. The app lets the user log
 * either and derives the other so the progression engine can reason in
 * one currency (RPE).
 */

export const rirToRpe = (rir: number): number => clampRpe(10 - rir);

export const rpeToRir = (rpe: number): number => Math.max(0, 10 - clampRpe(rpe));

export const clampRpe = (rpe: number): number => Math.min(10, Math.max(1, rpe));

/** Resolve the effective RPE of a set given whichever field was logged. */
export const effectiveRpe = (set: { rpe?: number; rir?: number; isFailure: boolean }): number | undefined => {
  if (set.isFailure) return 10;
  if (set.rpe !== undefined) return clampRpe(set.rpe);
  if (set.rir !== undefined) return rirToRpe(set.rir);
  return undefined;
};

/** Human-readable label for an RPE value, used in pickers and cues. */
export const rpeLabel = (rpe: number): string => {
  if (rpe >= 10) return 'Max effort — nothing left';
  if (rpe >= 9) return 'Very hard — 1 rep left';
  if (rpe >= 8) return 'Hard — 2 reps left';
  if (rpe >= 7) return 'Challenging — 3 reps left';
  if (rpe >= 5) return 'Moderate — 4+ reps left';
  return 'Easy — warm-up territory';
};

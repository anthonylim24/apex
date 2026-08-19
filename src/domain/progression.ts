import { effectiveRpe } from './effort';
import { bestSessionE1Rm } from './oneRepMax';
import type {
  Exercise,
  ProgressionSuggestion,
  SessionExercise,
  SetLog,
  Unit,
} from './types';
import { fromDisplayWeight, roundToIncrement, smallestIncrement, toDisplayWeight } from './units';

/**
 * Progressive-overload engine.
 *
 * Grounded in well-established principles only:
 * - Progressive overload: small, regular increases in load or reps.
 * - RPE/RIR autoregulation: progress when effort is submaximal (RPE <= 8,
 *   i.e. >= 2 reps in reserve); consolidate when effort is near-maximal.
 * - Double progression: fill the rep range first when a load jump would
 *   be disproportionate for the equipment's smallest increment.
 * - Deload heuristics: when estimated 1RM stalls while effort climbs,
 *   recovery — not more load — is the limiter.
 *
 * Every suggestion carries a plain-language rationale so the user can
 * always understand (and override) the recommendation. Suggestions are
 * advice, never auto-applied.
 */

/** Per-session snapshot of one exercise's performance, used for trends. */
export interface SessionPerformance {
  date: string;
  bestE1RmKg: number;
  avgRpe?: number;
  completedAllTargets: boolean;
}

export interface ProgressionInput {
  exercise: Pick<Exercise, 'equipment' | 'movementPattern'>;
  prescription: Pick<SessionExercise, 'targetSets' | 'targetRepsMin' | 'targetRepsMax'>;
  /** Working sets from the most recent session of this exercise. */
  lastSets: SetLog[];
  /** Oldest-first performance snapshots, including the last session. */
  history: SessionPerformance[];
  unit: Unit;
}

const LOWER_BODY_PATTERNS = new Set(['squat', 'hinge', 'lunge']);

/** % load increase when progression criteria are met. Lower-body compound
 * lifts tolerate larger jumps (heavier absolute loads, bigger muscles). */
const increasePercent = (pattern: string): number =>
  LOWER_BODY_PATTERNS.has(pattern) ? 0.05 : 0.025;

const STAGNATION_WINDOW = 3;
const STAGNATION_E1RM_TOLERANCE = 0.01; // <1% improvement across the window
const HIGH_FATIGUE_RPE = 8.5;

export const averageRpe = (sets: SetLog[]): number | undefined => {
  const values = sets
    .filter((s) => !s.isWarmup)
    .map((s) => effectiveRpe(s))
    .filter((v): v is number => v !== undefined);
  if (values.length === 0) return undefined;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

/** Summarize a finished session-exercise into a trend snapshot. */
export const buildSessionPerformance = (
  sets: SetLog[],
  prescription: Pick<SessionExercise, 'targetSets' | 'targetRepsMin' | 'targetRepsMax'>,
  date: string,
): SessionPerformance => {
  const working = sets.filter((s) => !s.isWarmup);
  return {
    date,
    bestE1RmKg: bestSessionE1Rm(sets),
    avgRpe: averageRpe(sets),
    completedAllTargets:
      working.length >= prescription.targetSets &&
      working.every((s) => s.reps >= prescription.targetRepsMin),
  };
};

/**
 * Stagnation = no meaningful e1RM improvement across the last N sessions
 * while average effort is high. Both must hold: a plateau at easy effort
 * just means the user is coasting and should progress normally.
 */
export const detectStagnation = (history: SessionPerformance[]): boolean => {
  if (history.length < STAGNATION_WINDOW) return false;
  const window = history.slice(-STAGNATION_WINDOW);
  const first = window[0].bestE1RmKg;
  const best = Math.max(...window.map((h) => h.bestE1RmKg));
  if (first <= 0) return false;
  const improvement = (best - first) / first;
  const rpes = window.map((h) => h.avgRpe).filter((v): v is number => v !== undefined);
  if (rpes.length === 0) return false;
  const avgWindowRpe = rpes.reduce((s, v) => s + v, 0) / rpes.length;
  return improvement < STAGNATION_E1RM_TOLERANCE && avgWindowRpe >= HIGH_FATIGUE_RPE;
};

const roundLoad = (kg: number, input: ProgressionInput): number => {
  const increment = smallestIncrement(input.exercise.equipment, input.unit);
  const display = toDisplayWeight(kg, input.unit);
  return fromDisplayWeight(roundToIncrement(display, increment), input.unit);
};

const confidenceFor = (input: ProgressionInput): ProgressionSuggestion['confidence'] => {
  const sessionsWithRpe = input.history.filter((h) => h.avgRpe !== undefined).length;
  if (sessionsWithRpe >= 2 && input.lastSets.length > 0) return 'high';
  if (input.lastSets.length > 0) return 'medium';
  return 'low';
};

export const suggestProgression = (input: ProgressionInput): ProgressionSuggestion => {
  const { prescription, unit } = input;
  const working = input.lastSets.filter((s) => !s.isWarmup);
  const confidence = confidenceFor(input);

  if (working.length === 0) {
    return {
      action: 'hold',
      nextWeightKg: 0,
      nextRepsMin: prescription.targetRepsMin,
      nextRepsMax: prescription.targetRepsMax,
      rationale:
        'No history for this exercise yet. Start light, focus on form, and log your effort (RPE) so future suggestions can be personalized.',
      confidence,
    };
  }

  const topWeightKg = Math.max(...working.map((s) => s.weightKg));
  const avgRpe = averageRpe(working);
  const allSetsDone = working.length >= prescription.targetSets;
  const hitMinReps = working.every((s) => s.reps >= prescription.targetRepsMin);
  const hitMaxReps = working.every((s) => s.reps >= prescription.targetRepsMax);
  const base = {
    nextRepsMin: prescription.targetRepsMin,
    nextRepsMax: prescription.targetRepsMax,
    confidence,
  };

  if (detectStagnation(input.history)) {
    const deloadKg = roundLoad(topWeightKg * 0.9, input);
    return {
      ...base,
      action: 'deload',
      nextWeightKg: deloadKg,
      rationale:
        'Your estimated 1RM has been flat for 3+ sessions while effort stayed high. A ~10% deload for a week lets fatigue dissipate so you can progress again — or try a similar exercise variation.',
    };
  }

  const missedReps = !allSetsDone || !hitMinReps;
  if (missedReps || (avgRpe !== undefined && avgRpe > 9.5)) {
    const reducedKg = roundLoad(topWeightKg * 0.95, input);
    return {
      ...base,
      action: 'reduce_load',
      nextWeightKg: reducedKg < topWeightKg ? reducedKg : topWeightKg,
      rationale: missedReps
        ? 'You missed the target reps last time. Dropping ~5% rebuilds momentum — progress comes from completing quality sets, not grinding failures.'
        : 'Every set was at or near failure (RPE 10). Backing off ~5% keeps 1-2 reps in reserve, which drives growth with less injury risk.',
    };
  }

  const rpeAllowsProgress = avgRpe === undefined || avgRpe <= 8;

  if (hitMaxReps && rpeAllowsProgress) {
    const pct = increasePercent(input.exercise.movementPattern);
    const rawTarget = topWeightKg * (1 + pct);
    let nextKg = roundLoad(rawTarget, input);
    // Guarantee at least one real plate/pin step, otherwise rounding could
    // hand back the same weight.
    if (nextKg <= topWeightKg) {
      const increment = smallestIncrement(input.exercise.equipment, unit);
      nextKg = fromDisplayWeight(
        roundToIncrement(toDisplayWeight(topWeightKg, unit) + increment, increment),
        unit,
      );
    }
    return {
      ...base,
      action: 'increase_load',
      nextWeightKg: nextKg,
      rationale: `You hit the top of the rep range on every set with effort to spare${
        avgRpe !== undefined ? ` (avg RPE ${avgRpe.toFixed(1)})` : ''
      }. Add ~${Math.round(pct * 100)}% and work back up through the range.`,
    };
  }

  if (hitMinReps && rpeAllowsProgress) {
    return {
      ...base,
      action: 'increase_reps',
      nextWeightKg: topWeightKg,
      rationale:
        'Same weight, aim for 1-2 more reps per set. Filling the rep range before adding load (double progression) suits this equipment\u2019s smallest jump.',
    };
  }

  return {
    ...base,
    action: 'hold',
    nextWeightKg: topWeightKg,
    rationale: `Solid work at high effort${
      avgRpe !== undefined ? ` (avg RPE ${avgRpe.toFixed(1)})` : ''
    }. Repeat this weight — consolidating before adding load is how sustainable progress works.`,
  };
};

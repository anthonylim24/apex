import { weightForReps } from './oneRepMax';
import type {
  Difficulty,
  Equipment,
  Exercise,
  ExperienceLevel,
  Goal,
  MovementPattern,
  MuscleGroup,
  Profile,
  SessionExercise,
} from './types';
import { fromDisplayWeight, roundToIncrement, smallestIncrement, toDisplayWeight } from './units';

/**
 * Science-based workout generation.
 *
 * Principles applied (see docs/science.md):
 * - Specificity: rep/set/rest schemes derive from the user's goal.
 * - Compound-first ordering: multi-joint patterns before isolation.
 * - Volume landmarks: accessories favor muscles currently under ~10 hard
 *   sets/week; generation never pushes a muscle past ~20 prescribed sets.
 * - Recovery: session fits the user's preferred time budget; effort is
 *   prescribed at RPE 7-8 (2-3 reps in reserve), not failure.
 * - Simple linear or daily-undulating (heavy/moderate/light) intensity.
 */

export interface RepScheme {
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
}

export type SessionIntensity = 'heavy' | 'moderate' | 'light';

const GOAL_SCHEMES: Record<Goal, Record<SessionIntensity, RepScheme>> = {
  strength: {
    heavy: { sets: 4, repsMin: 3, repsMax: 5, restSeconds: 180 },
    moderate: { sets: 4, repsMin: 4, repsMax: 6, restSeconds: 150 },
    light: { sets: 3, repsMin: 6, repsMax: 8, restSeconds: 120 },
  },
  hypertrophy: {
    heavy: { sets: 4, repsMin: 6, repsMax: 8, restSeconds: 150 },
    moderate: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 120 },
    light: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 90 },
  },
  endurance: {
    heavy: { sets: 3, repsMin: 10, repsMax: 12, restSeconds: 90 },
    moderate: { sets: 3, repsMin: 12, repsMax: 15, restSeconds: 60 },
    light: { sets: 2, repsMin: 15, repsMax: 20, restSeconds: 45 },
  },
  general: {
    heavy: { sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120 },
    moderate: { sets: 3, repsMin: 8, repsMax: 12, restSeconds: 90 },
    light: { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 75 },
  },
};

/** Isolation work uses a gentler scheme regardless of goal. */
const ISOLATION_SCHEME: RepScheme = { sets: 3, repsMin: 10, repsMax: 15, restSeconds: 75 };

const COMPOUND_PATTERN_PRIORITY: MovementPattern[] = [
  'squat',
  'horizontal_push',
  'horizontal_pull',
  'hinge',
  'vertical_push',
  'vertical_pull',
  'lunge',
];

const DIFFICULTY_RANK: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const EXPERIENCE_RANK: Record<ExperienceLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

const SECONDS_PER_REP_SET = 40;
const EXERCISE_SETUP_SECONDS = 90;
const WEEKLY_MIN_EFFECTIVE_SETS = 10;
const WEEKLY_MAX_SETS = 20;

export interface GenerationInput {
  profile: Pick<
    Profile,
    'goal' | 'experience' | 'equipment' | 'avoidMuscles' | 'preferredSessionMinutes' | 'unit'
  >;
  library: Exercise[];
  /** Best estimated 1RM (kg) per exercise id, from history. */
  e1RmByExercise: Record<string, number>;
  /** Hard sets logged per muscle over the trailing 7 days. */
  weeklySetsPerMuscle: Partial<Record<MuscleGroup, number>>;
  intensity?: SessionIntensity;
  /** Injectable for deterministic tests; defaults to Math.random. */
  random?: () => number;
  now?: () => Date;
}

export interface GeneratedWorkout {
  name: string;
  exercises: SessionExercise[];
  estimatedMinutes: number;
}

const estimateSeconds = (scheme: RepScheme): number =>
  EXERCISE_SETUP_SECONDS + scheme.sets * (SECONDS_PER_REP_SET + scheme.restSeconds);

export const isExerciseUsable = (
  exercise: Exercise,
  equipment: Equipment[],
  experience: ExperienceLevel,
  avoidMuscles: MuscleGroup[],
): boolean => {
  const owned = new Set<Equipment>([...equipment, 'bodyweight']);
  return (
    exercise.equipment.every((e) => owned.has(e)) &&
    DIFFICULTY_RANK[exercise.difficulty] <= EXPERIENCE_RANK[experience] &&
    !exercise.primaryMuscles.some((m) => avoidMuscles.includes(m))
  );
};

/** Prescribe a working weight at ~2 reps in reserve from a known e1RM. */
export const prescribeWeightKg = (
  e1RmKg: number | undefined,
  repsMax: number,
  exercise: Pick<Exercise, 'equipment'>,
  unit: Profile['unit'],
): number | undefined => {
  if (!e1RmKg || e1RmKg <= 0) return undefined;
  const raw = weightForReps(e1RmKg, repsMax + 2);
  const increment = smallestIncrement(exercise.equipment, unit);
  return fromDisplayWeight(roundToIncrement(toDisplayWeight(raw, unit), increment), unit);
};

const pickFrom = <T>(items: T[], random: () => number): T | undefined =>
  items.length === 0 ? undefined : items[Math.floor(random() * items.length)];

export const generateWorkout = (input: GenerationInput): GeneratedWorkout => {
  const { profile, library } = input;
  const random = input.random ?? Math.random;
  const now = input.now ?? (() => new Date());
  const intensity = input.intensity ?? 'moderate';
  const scheme = GOAL_SCHEMES[profile.goal][intensity];
  const budgetSeconds = profile.preferredSessionMinutes * 60;

  const usable = library.filter((e) =>
    isExerciseUsable(e, profile.equipment, profile.experience, profile.avoidMuscles),
  );

  const prescribedSetsPerMuscle: Partial<Record<MuscleGroup, number>> = {
    ...input.weeklySetsPerMuscle,
  };
  const chosen: Exercise[] = [];
  let secondsUsed = 0;

  const withinWeeklyCap = (exercise: Exercise, sets: number): boolean =>
    exercise.primaryMuscles.every(
      (m) => (prescribedSetsPerMuscle[m] ?? 0) + sets <= WEEKLY_MAX_SETS,
    );

  const commit = (exercise: Exercise, sets: number, seconds: number): void => {
    chosen.push(exercise);
    secondsUsed += seconds;
    for (const m of exercise.primaryMuscles) {
      prescribedSetsPerMuscle[m] = (prescribedSetsPerMuscle[m] ?? 0) + sets;
    }
  };

  // 1) Compound base: one exercise per priority pattern while time allows.
  for (const pattern of COMPOUND_PATTERN_PRIORITY) {
    const cost = estimateSeconds(scheme);
    if (secondsUsed + cost > budgetSeconds) break;
    const candidates = usable.filter(
      (e) =>
        e.movementPattern === pattern &&
        !chosen.includes(e) &&
        withinWeeklyCap(e, scheme.sets),
    );
    const pick = pickFrom(candidates, random);
    if (pick) commit(pick, scheme.sets, cost);
  }

  // 2) Accessories: fill remaining time favoring under-trained muscles.
  const isolationCost = estimateSeconds(ISOLATION_SCHEME);
  while (secondsUsed + isolationCost <= budgetSeconds) {
    const accessories = usable.filter(
      (e) =>
        (e.movementPattern === 'isolation' || e.movementPattern === 'core') &&
        !chosen.includes(e) &&
        withinWeeklyCap(e, ISOLATION_SCHEME.sets),
    );
    if (accessories.length === 0) break;
    const underTrained = accessories.filter((e) =>
      e.primaryMuscles.some((m) => (prescribedSetsPerMuscle[m] ?? 0) < WEEKLY_MIN_EFFECTIVE_SETS),
    );
    const pick = pickFrom(underTrained.length > 0 ? underTrained : accessories, random);
    if (!pick) break;
    commit(pick, ISOLATION_SCHEME.sets, isolationCost);
  }

  const timestamp = now().toISOString();
  const exercises: SessionExercise[] = chosen.map((exercise, index) => {
    const exScheme = exercise.movementPattern === 'isolation' ? ISOLATION_SCHEME : scheme;
    return {
      id: `gen-${timestamp}-${index}`,
      exerciseId: exercise.id,
      order: index,
      targetSets: exScheme.sets,
      targetRepsMin: exScheme.repsMin,
      targetRepsMax: exScheme.repsMax,
      targetWeightKg: prescribeWeightKg(
        input.e1RmByExercise[exercise.id],
        exScheme.repsMax,
        exercise,
        profile.unit,
      ),
      restSeconds: exScheme.restSeconds,
      sets: [],
    };
  });

  const intensityLabel = intensity === 'moderate' ? '' : ` (${intensity})`;
  return {
    name: `${profile.goal[0].toUpperCase()}${profile.goal.slice(1)} session${intensityLabel}`,
    exercises,
    estimatedMinutes: Math.round(secondsUsed / 60),
  };
};

export const schemeForGoal = (goal: Goal, intensity: SessionIntensity = 'moderate'): RepScheme =>
  GOAL_SCHEMES[goal][intensity];

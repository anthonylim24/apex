/**
 * Core domain types shared by the app, the progression engine, the sync
 * layer, and the Supabase schema. Weights are stored canonically in
 * kilograms; conversion to the user's preferred unit happens at the edge
 * (see `units.ts`).
 */

export type Unit = 'kg' | 'lb';

export type Goal = 'hypertrophy' | 'strength' | 'endurance' | 'general';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'band'
  | 'bench'
  | 'pullup_bar';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'lats'
  | 'traps'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'lower_back';

export type MovementPattern =
  | 'horizontal_push'
  | 'horizontal_pull'
  | 'vertical_push'
  | 'vertical_pull'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'carry'
  | 'isolation'
  | 'core';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  movementPattern: MovementPattern;
  /** Lottie JSON url/asset key. See docs/design/animation-style-guide.md */
  animationUrl?: string;
  videoUrl?: string;
  isCustom: boolean;
  createdBy?: string;
}

export interface BodyweightEntry {
  date: string; // ISO date (yyyy-mm-dd)
  weightKg: number;
}

export interface Profile {
  userId: string;
  displayName?: string;
  goal: Goal;
  experience: ExperienceLevel;
  equipment: Equipment[];
  /** Free-text injuries/limitations, plus structured muscles to avoid. */
  limitations: string;
  avoidMuscles: MuscleGroup[];
  unit: Unit;
  preferredSessionMinutes: number;
  bodyweightHistory: BodyweightEntry[];
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** One logged (or prescribed) set. `rpe` and `rir` are alternatives; the
 * app stores whichever the user entered and derives the other. */
export interface SetLog {
  id: string;
  setNumber: number;
  weightKg: number;
  reps: number;
  rpe?: number; // 1-10
  rir?: number; // reps in reserve
  isWarmup: boolean;
  isFailure: boolean;
  isDropSet: boolean;
  autoDetected: boolean;
  confidence?: number; // 0-1, only for auto-detected sets (Phase 3)
  avgHr?: number;
  notes?: string;
  completedAt: string;
}

/** Prescription for one exercise inside a planned/live workout. */
export interface SessionExercise {
  id: string;
  exerciseId: string;
  order: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeightKg?: number;
  restSeconds: number;
  sets: SetLog[];
  notes?: string;
}

export type SessionStatus = 'planned' | 'active' | 'completed' | 'discarded';

export interface WorkoutSession {
  id: string;
  userId: string;
  name: string;
  status: SessionStatus;
  startedAt: string;
  completedAt?: string;
  exercises: SessionExercise[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SuggestionAction =
  | 'increase_load'
  | 'increase_reps'
  | 'hold'
  | 'reduce_load'
  | 'deload';

export interface ProgressionSuggestion {
  action: SuggestionAction;
  nextWeightKg: number;
  nextRepsMin: number;
  nextRepsMax: number;
  /** Plain-language, science-grounded explanation shown to the user. */
  rationale: string;
  /** How confident the engine is, based on data quantity/quality. */
  confidence: 'low' | 'medium' | 'high';
}

export interface PersonalRecord {
  exerciseId: string;
  kind: 'weight' | 'estimated_1rm' | 'reps_at_weight';
  valueKg: number;
  reps: number;
  achievedAt: string;
  sessionId: string;
}

export interface WeeklySummary {
  weekStart: string; // ISO date of Monday
  workouts: number;
  minutes: number;
  totalVolumeKg: number;
  setsPerMuscle: Partial<Record<MuscleGroup, number>>;
}

import { create } from 'zustand';
import { detectNewPrs } from '../domain/stats';
import type {
  PersonalRecord,
  SessionExercise,
  SetLog,
  WorkoutSession,
} from '../domain/types';

export interface SetDraft {
  weightKg: number;
  reps: number;
  effort?: number;
  isWarmup: boolean;
  isFailure: boolean;
  isDropSet: boolean;
}

/**
 * Build the pre-filled draft for the next set: last logged set of this
 * exercise wins (mid-session), then last session's matching set, then
 * the prescription target. Logging a repeat set is a single tap.
 */
export const buildDraft = (
  exercise: SessionExercise,
  lastSessionSets: SetLog[],
): SetDraft => {
  const logged = exercise.sets.filter((s) => !s.isWarmup);
  const nextSetNumber = logged.length + 1;
  const fromCurrent = logged[logged.length - 1];
  const fromLast =
    lastSessionSets.filter((s) => !s.isWarmup)[nextSetNumber - 1] ??
    lastSessionSets.filter((s) => !s.isWarmup)[0];
  const source = fromCurrent ?? fromLast;
  return {
    weightKg: source?.weightKg ?? exercise.targetWeightKg ?? 0,
    reps: source?.reps ?? exercise.targetRepsMax,
    effort: undefined,
    isWarmup: false,
    isFailure: false,
    isDropSet: false,
  };
};

interface LiveSessionState {
  session: WorkoutSession | undefined;
  exerciseIndex: number;
  draft: SetDraft;
  /** Epoch ms when the current rest period ends; undefined = not resting. */
  restEndsAt: number | undefined;
  restTotalSeconds: number;
  pendingPrs: PersonalRecord[];
  effortMode: 'rpe' | 'rir';

  start: (session: WorkoutSession, effortMode?: 'rpe' | 'rir') => void;
  selectExercise: (index: number, lastSessionSets?: SetLog[]) => void;
  setDraft: (draft: SetDraft) => void;
  /** Log the draft as a completed set. Returns the updated session. */
  logSet: (now?: Date) => WorkoutSession | undefined;
  adjustRest: (deltaSeconds: number, now?: Date) => void;
  skipRest: () => void;
  /** Complete the session; computes PRs against `priorSessions`. */
  finish: (priorSessions: WorkoutSession[], now?: Date) => WorkoutSession | undefined;
  discard: () => WorkoutSession | undefined;
  dismissPrs: () => void;
  reset: () => void;
}

const EMPTY_DRAFT: SetDraft = {
  weightKg: 0,
  reps: 0,
  effort: undefined,
  isWarmup: false,
  isFailure: false,
  isDropSet: false,
};

let setIdCounter = 0;
const newSetId = (): string =>
  `set-${Date.now().toString(36)}-${(setIdCounter += 1).toString(36)}`;

export const useSessionStore = create<LiveSessionState>((set, get) => ({
  session: undefined,
  exerciseIndex: 0,
  draft: EMPTY_DRAFT,
  restEndsAt: undefined,
  restTotalSeconds: 0,
  pendingPrs: [],
  effortMode: 'rpe',

  start: (session, effortMode = 'rpe') => {
    const first = session.exercises[0];
    set({
      session: { ...session, status: 'active' },
      exerciseIndex: 0,
      draft: first ? buildDraft(first, []) : EMPTY_DRAFT,
      restEndsAt: undefined,
      restTotalSeconds: 0,
      pendingPrs: [],
      effortMode,
    });
  },

  selectExercise: (index, lastSessionSets = []) => {
    const { session } = get();
    if (!session) return;
    const clamped = Math.max(0, Math.min(index, session.exercises.length - 1));
    set({
      exerciseIndex: clamped,
      draft: buildDraft(session.exercises[clamped], lastSessionSets),
    });
  },

  setDraft: (draft) => set({ draft }),

  logSet: (now = new Date()) => {
    const { session, exerciseIndex, draft, effortMode } = get();
    if (!session || draft.reps <= 0) return session;
    const exercise = session.exercises[exerciseIndex];
    if (!exercise) return session;

    const logged: SetLog = {
      id: newSetId(),
      setNumber: exercise.sets.filter((s) => !s.isWarmup).length + (draft.isWarmup ? 0 : 1),
      weightKg: draft.weightKg,
      reps: draft.reps,
      rpe: effortMode === 'rpe' ? draft.effort : undefined,
      rir: effortMode === 'rir' ? draft.effort : undefined,
      isWarmup: draft.isWarmup,
      isFailure: draft.isFailure,
      isDropSet: draft.isDropSet,
      autoDetected: false,
      completedAt: now.toISOString(),
    };

    const updatedExercise: SessionExercise = {
      ...exercise,
      sets: [...exercise.sets, logged],
    };
    const updatedSession: WorkoutSession = {
      ...session,
      exercises: session.exercises.map((ex, i) => (i === exerciseIndex ? updatedExercise : ex)),
      updatedAt: now.toISOString(),
    };

    // Warm-ups get a short fixed rest; working sets use the prescription.
    const restSeconds = draft.isWarmup ? 60 : exercise.restSeconds;
    set({
      session: updatedSession,
      draft: { ...buildDraft(updatedExercise, []), isWarmup: false },
      restEndsAt: now.getTime() + restSeconds * 1000,
      restTotalSeconds: restSeconds,
    });
    return updatedSession;
  },

  adjustRest: (deltaSeconds, now = new Date()) => {
    const { restEndsAt, restTotalSeconds } = get();
    if (restEndsAt === undefined) return;
    const newEnd = Math.max(now.getTime(), restEndsAt + deltaSeconds * 1000);
    set({
      restEndsAt: newEnd,
      restTotalSeconds: Math.max(1, restTotalSeconds + deltaSeconds),
    });
  },

  skipRest: () => set({ restEndsAt: undefined, restTotalSeconds: 0 }),

  finish: (priorSessions, now = new Date()) => {
    const { session } = get();
    if (!session) return undefined;
    const completed: WorkoutSession = {
      ...session,
      // Drop exercises the user never touched so history stays honest.
      exercises: session.exercises.filter((ex) => ex.sets.length > 0),
      status: 'completed',
      completedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const prs = detectNewPrs(completed, priorSessions);
    set({ session: completed, pendingPrs: prs, restEndsAt: undefined });
    return completed;
  },

  discard: () => {
    const { session } = get();
    if (!session) return undefined;
    const discarded: WorkoutSession = {
      ...session,
      status: 'discarded',
      updatedAt: new Date().toISOString(),
    };
    set({
      session: undefined,
      exerciseIndex: 0,
      draft: EMPTY_DRAFT,
      restEndsAt: undefined,
      pendingPrs: [],
    });
    return discarded;
  },

  dismissPrs: () => set({ pendingPrs: [] }),

  reset: () =>
    set({
      session: undefined,
      exerciseIndex: 0,
      draft: EMPTY_DRAFT,
      restEndsAt: undefined,
      restTotalSeconds: 0,
      pendingPrs: [],
    }),
}));

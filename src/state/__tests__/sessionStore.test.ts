import { makeSession, makeSet } from '../../domain/__tests__/factories';
import type { SessionExercise, WorkoutSession } from '../../domain/types';
import { buildDraft, useSessionStore } from '../sessionStore';

const planExercise = (id: string, targetWeightKg?: number): SessionExercise => ({
  id: `se-${id}`,
  exerciseId: id,
  order: 0,
  targetSets: 3,
  targetRepsMin: 6,
  targetRepsMax: 8,
  targetWeightKg,
  restSeconds: 120,
  sets: [],
});

const plannedSession = (): WorkoutSession =>
  makeSession({
    id: 'live-1',
    status: 'planned',
    completedAt: undefined,
    exercises: [planExercise('bench', 80), planExercise('squat', 100)],
  });

const store = useSessionStore;

beforeEach(() => store.getState().reset());

describe('buildDraft', () => {
  it('prefills from the prescription when there is no history', () => {
    const draft = buildDraft(planExercise('bench', 80), []);
    expect(draft).toMatchObject({ weightKg: 80, reps: 8, isWarmup: false });
  });

  it('prefers last session performance over the prescription', () => {
    const last = [makeSet({ weightKg: 82.5, reps: 7 })];
    const draft = buildDraft(planExercise('bench', 80), last);
    expect(draft).toMatchObject({ weightKg: 82.5, reps: 7 });
  });

  it('prefers the set just logged in the current session', () => {
    const exercise = { ...planExercise('bench', 80), sets: [makeSet({ weightKg: 85, reps: 6 })] };
    const draft = buildDraft(exercise, [makeSet({ weightKg: 80, reps: 8 })]);
    expect(draft).toMatchObject({ weightKg: 85, reps: 6 });
  });
});

describe('live session flow', () => {
  it('starts a session and logs sets with the rest timer', () => {
    const now = new Date('2026-08-19T10:00:00.000Z');
    store.getState().start(plannedSession());
    expect(store.getState().session?.status).toBe('active');
    expect(store.getState().draft.weightKg).toBe(80);

    const updated = store.getState().logSet(now);
    expect(updated?.exercises[0].sets).toHaveLength(1);
    expect(updated?.exercises[0].sets[0]).toMatchObject({ weightKg: 80, reps: 8, setNumber: 1 });
    // Rest timer armed for the prescription's 120s.
    expect(store.getState().restEndsAt).toBe(now.getTime() + 120_000);
    expect(store.getState().restTotalSeconds).toBe(120);
    // Draft pre-filled for the next set.
    expect(store.getState().draft).toMatchObject({ weightKg: 80, reps: 8, isFailure: false });
  });

  it('records effort in the configured mode and resets tags per set', () => {
    store.getState().start(plannedSession(), 'rir');
    store.getState().setDraft({ ...store.getState().draft, effort: 2, isFailure: true });
    const updated = store.getState().logSet();
    const logged = updated!.exercises[0].sets[0];
    expect(logged.rir).toBe(2);
    expect(logged.rpe).toBeUndefined();
    expect(logged.isFailure).toBe(true);
    expect(store.getState().draft.isFailure).toBe(false);
  });

  it('does not log a zero-rep draft', () => {
    store.getState().start(plannedSession());
    store.getState().setDraft({ ...store.getState().draft, reps: 0 });
    const updated = store.getState().logSet();
    expect(updated?.exercises[0].sets).toHaveLength(0);
  });

  it('warm-up sets do not advance the working set counter', () => {
    store.getState().start(plannedSession());
    store.getState().setDraft({ ...store.getState().draft, isWarmup: true, weightKg: 40, reps: 10 });
    store.getState().logSet();
    store.getState().logSet(); // working set
    const sets = store.getState().session!.exercises[0].sets;
    expect(sets[0].isWarmup).toBe(true);
    expect(sets[1].setNumber).toBe(1);
  });

  it('adjusts and skips rest on the fly', () => {
    const now = new Date('2026-08-19T10:00:00.000Z');
    store.getState().start(plannedSession());
    store.getState().logSet(now);
    store.getState().adjustRest(15, now);
    expect(store.getState().restEndsAt).toBe(now.getTime() + 135_000);
    store.getState().adjustRest(-999, now); // clamp to "now"
    expect(store.getState().restEndsAt).toBe(now.getTime());
    store.getState().skipRest();
    expect(store.getState().restEndsAt).toBeUndefined();
  });

  it('navigates exercises and prefills drafts from last session data', () => {
    store.getState().start(plannedSession());
    store.getState().selectExercise(1, [makeSet({ weightKg: 105, reps: 5 })]);
    expect(store.getState().exerciseIndex).toBe(1);
    expect(store.getState().draft).toMatchObject({ weightKg: 105, reps: 5 });
    store.getState().selectExercise(99);
    expect(store.getState().exerciseIndex).toBe(1); // clamped
  });

  it('finishes a session, drops untouched exercises, and detects PRs', () => {
    const prior = makeSession({
      id: 'prior',
      startedAt: '2026-08-01T10:00:00.000Z',
      exercises: [{ ...planExercise('bench'), sets: [makeSet({ weightKg: 80, reps: 8 })] }],
    });
    store.getState().start(plannedSession());
    store.getState().setDraft({ ...store.getState().draft, weightKg: 85, reps: 8 });
    store.getState().logSet();
    const completed = store.getState().finish([prior]);
    expect(completed?.status).toBe('completed');
    expect(completed?.exercises).toHaveLength(1); // squat was never touched
    expect(store.getState().pendingPrs.length).toBeGreaterThan(0);
    store.getState().dismissPrs();
    expect(store.getState().pendingPrs).toHaveLength(0);
  });

  it('discards a session cleanly', () => {
    store.getState().start(plannedSession());
    store.getState().logSet();
    const discarded = store.getState().discard();
    expect(discarded?.status).toBe('discarded');
    expect(store.getState().session).toBeUndefined();
  });
});

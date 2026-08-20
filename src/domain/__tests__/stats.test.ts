import {
  consistency,
  detectNewPrs,
  e1RmTrend,
  sessionMinutes,
  sessionVolumeKg,
  setsPerMuscle,
  volumeTrend,
  weeklySummaries,
  weekStartOf,
} from '../stats';
import type { SessionExercise } from '../types';
import { makeExercise, makeSession, makeSet } from './factories';

const bench = makeExercise({ id: 'bench', primaryMuscles: ['chest'] });
const squat = makeExercise({ id: 'squat', primaryMuscles: ['quads', 'glutes'], movementPattern: 'squat' });
const exercisesById = { bench, squat };

const sessionExercise = (
  exerciseId: string,
  sets: ReturnType<typeof makeSet>[],
): SessionExercise => ({
  id: `se-${exerciseId}`,
  exerciseId,
  order: 0,
  targetSets: 3,
  targetRepsMin: 6,
  targetRepsMax: 8,
  restSeconds: 120,
  sets,
});

describe('weekStartOf', () => {
  it('returns the Monday of the containing week', () => {
    expect(weekStartOf('2026-08-10')).toBe('2026-08-10'); // a Monday
    expect(weekStartOf('2026-08-13')).toBe('2026-08-10'); // Thursday
    expect(weekStartOf('2026-08-16')).toBe('2026-08-10'); // Sunday
    expect(weekStartOf('2026-08-17')).toBe('2026-08-17'); // next Monday
  });
});

describe('session aggregates', () => {
  const session = makeSession({
    startedAt: '2026-08-10T10:00:00.000Z',
    completedAt: '2026-08-10T10:47:30.000Z',
    exercises: [
      sessionExercise('bench', [
        makeSet({ weightKg: 40, reps: 10, isWarmup: true }),
        makeSet({ weightKg: 80, reps: 8 }),
        makeSet({ weightKg: 80, reps: 8 }),
      ]),
      sessionExercise('squat', [makeSet({ weightKg: 100, reps: 5 })]),
    ],
  });

  it('computes volume from working sets only', () => {
    expect(sessionVolumeKg(session)).toBe(80 * 8 * 2 + 100 * 5);
  });

  it('computes duration in minutes', () => {
    expect(sessionMinutes(session)).toBe(48);
  });

  it('counts hard sets per primary muscle', () => {
    expect(setsPerMuscle(session, exercisesById)).toEqual({ chest: 2, quads: 1, glutes: 1 });
  });
});

describe('weeklySummaries', () => {
  it('groups completed sessions into ISO weeks', () => {
    const sessions = [
      makeSession({ startedAt: '2026-08-10T10:00:00.000Z', completedAt: '2026-08-10T10:45:00.000Z', exercises: [sessionExercise('bench', [makeSet({ weightKg: 80, reps: 8 })])] }),
      makeSession({ startedAt: '2026-08-12T10:00:00.000Z', completedAt: '2026-08-12T10:30:00.000Z', exercises: [sessionExercise('squat', [makeSet({ weightKg: 100, reps: 5 })])] }),
      makeSession({ startedAt: '2026-08-17T10:00:00.000Z', completedAt: '2026-08-17T11:00:00.000Z' }),
      makeSession({ status: 'discarded', startedAt: '2026-08-18T10:00:00.000Z' }),
    ];
    const weeks = weeklySummaries(sessions, exercisesById);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toMatchObject({
      weekStart: '2026-08-10',
      workouts: 2,
      minutes: 75,
      totalVolumeKg: 80 * 8 + 100 * 5,
    });
    expect(weeks[0].setsPerMuscle).toEqual({ chest: 1, quads: 1, glutes: 1 });
    expect(weeks[1].workouts).toBe(1);
  });
});

describe('trends', () => {
  const sessions = [
    makeSession({
      startedAt: '2026-08-03T10:00:00.000Z',
      exercises: [sessionExercise('bench', [makeSet({ weightKg: 77.5, reps: 8 })])],
    }),
    makeSession({
      startedAt: '2026-08-10T10:00:00.000Z',
      exercises: [sessionExercise('bench', [makeSet({ weightKg: 80, reps: 8 })])],
    }),
  ];

  it('produces an oldest-first e1RM trend', () => {
    const trend = e1RmTrend(sessions, 'bench');
    expect(trend.map((p) => p.date)).toEqual(['2026-08-03', '2026-08-10']);
    expect(trend[1].value).toBeGreaterThan(trend[0].value);
  });

  it('produces a volume trend and skips sessions without the exercise', () => {
    const trend = volumeTrend(sessions, 'squat');
    expect(trend).toHaveLength(0);
  });
});

describe('detectNewPrs', () => {
  const prior = makeSession({
    id: 'prior',
    startedAt: '2026-08-03T10:00:00.000Z',
    exercises: [sessionExercise('bench', [makeSet({ weightKg: 80, reps: 8 })])],
  });

  it('detects weight and e1RM PRs against prior sessions', () => {
    const current = makeSession({
      id: 'current',
      startedAt: '2026-08-10T10:00:00.000Z',
      exercises: [sessionExercise('bench', [makeSet({ weightKg: 85, reps: 8, completedAt: '2026-08-10T10:20:00.000Z' })])],
    });
    const prs = detectNewPrs(current, [prior, current]);
    expect(prs.map((p) => p.kind).sort()).toEqual(['estimated_1rm', 'weight']);
    expect(prs[0].exerciseId).toBe('bench');
  });

  it('does not celebrate the first-ever session as a PR', () => {
    const prs = detectNewPrs(prior, [prior]);
    expect(prs).toHaveLength(0);
  });

  it('returns nothing when performance did not exceed history', () => {
    const current = makeSession({
      id: 'current',
      exercises: [sessionExercise('bench', [makeSet({ weightKg: 75, reps: 8 })])],
    });
    expect(detectNewPrs(current, [prior, current])).toHaveLength(0);
  });
});

describe('consistency', () => {
  it('reports workouts for each trailing week including empty ones', () => {
    const sessions = [
      makeSession({ startedAt: '2026-08-10T10:00:00.000Z' }),
      makeSession({ startedAt: '2026-08-12T10:00:00.000Z' }),
    ];
    const result = consistency(sessions, 3, new Date('2026-08-19T12:00:00.000Z'));
    expect(result).toEqual([
      { weekStart: '2026-08-03', workouts: 0 },
      { weekStart: '2026-08-10', workouts: 2 },
      { weekStart: '2026-08-17', workouts: 0 },
    ]);
  });
});

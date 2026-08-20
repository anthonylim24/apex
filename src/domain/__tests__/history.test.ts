import {
  bestE1RmByExercise,
  lastPerformance,
  performanceHistory,
  weeklySetsPerMuscle,
} from '../history';
import { makeExercise, makeSession, makeSet } from './factories';
import type { SessionExercise } from '../types';

const exerciseEntry = (
  exerciseId: string,
  sets: ReturnType<typeof makeSet>[],
): SessionExercise => ({
  id: `se-${exerciseId}-${Math.random()}`,
  exerciseId,
  order: 0,
  targetSets: 3,
  targetRepsMin: 6,
  targetRepsMax: 8,
  restSeconds: 120,
  sets,
});

const sessions = [
  makeSession({
    id: 'a',
    startedAt: '2026-08-03T10:00:00.000Z',
    exercises: [exerciseEntry('bench', [makeSet({ weightKg: 77.5, reps: 8, rpe: 7 })])],
  }),
  makeSession({
    id: 'b',
    startedAt: '2026-08-10T10:00:00.000Z',
    exercises: [exerciseEntry('bench', [makeSet({ weightKg: 80, reps: 8, rpe: 7.5 })])],
  }),
  makeSession({
    id: 'c',
    status: 'discarded',
    startedAt: '2026-08-12T10:00:00.000Z',
    exercises: [exerciseEntry('bench', [makeSet({ weightKg: 100, reps: 8 })])],
  }),
];

describe('lastPerformance', () => {
  it('returns the most recent completed sets for an exercise', () => {
    const sets = lastPerformance(sessions, 'bench');
    expect(sets).toHaveLength(1);
    expect(sets[0].weightKg).toBe(80);
  });

  it('ignores discarded sessions and unknown exercises', () => {
    expect(lastPerformance(sessions, 'squat')).toHaveLength(0);
  });
});

describe('performanceHistory', () => {
  it('builds oldest-first snapshots for the progression engine', () => {
    const history = performanceHistory(sessions, 'bench', {
      targetSets: 1,
      targetRepsMin: 6,
      targetRepsMax: 8,
    });
    expect(history).toHaveLength(2);
    expect(history[0].date).toBe('2026-08-03');
    expect(history[1].bestE1RmKg).toBeGreaterThan(history[0].bestE1RmKg);
    expect(history[1].completedAllTargets).toBe(true);
  });
});

describe('bestE1RmByExercise', () => {
  it('finds the best estimate across completed sessions only', () => {
    const best = bestE1RmByExercise(sessions);
    expect(best.bench).toBeCloseTo(80 * (1 + 8 / 30), 5);
  });
});

describe('weeklySetsPerMuscle', () => {
  it('counts hard sets in the trailing week by primary muscle', () => {
    const byId = { bench: makeExercise({ id: 'bench', primaryMuscles: ['chest'] }) };
    const now = new Date('2026-08-12T12:00:00.000Z');
    const result = weeklySetsPerMuscle(sessions, byId, now);
    expect(result.chest).toBe(1); // only session b is inside the window
  });
});

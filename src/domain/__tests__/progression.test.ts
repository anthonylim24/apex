import {
  averageRpe,
  buildSessionPerformance,
  detectStagnation,
  suggestProgression,
  type ProgressionInput,
  type SessionPerformance,
} from '../progression';
import { makeSet } from './factories';

const barbell = { equipment: ['barbell', 'bench'] as const, movementPattern: 'horizontal_push' as const };
const squat = { equipment: ['barbell'] as const, movementPattern: 'squat' as const };

const prescription = { targetSets: 3, targetRepsMin: 6, targetRepsMax: 8 };

const input = (overrides: Partial<ProgressionInput>): ProgressionInput => ({
  exercise: { equipment: [...barbell.equipment], movementPattern: barbell.movementPattern },
  prescription,
  lastSets: [],
  history: [],
  unit: 'kg',
  ...overrides,
});

const perf = (overrides: Partial<SessionPerformance>): SessionPerformance => ({
  date: '2026-08-01',
  bestE1RmKg: 100,
  avgRpe: 7,
  completedAllTargets: true,
  ...overrides,
});

describe('suggestProgression', () => {
  it('holds with low confidence when there is no history', () => {
    const result = suggestProgression(input({}));
    expect(result.action).toBe('hold');
    expect(result.confidence).toBe('low');
    expect(result.rationale).toMatch(/no history/i);
  });

  it('suggests +2.5% load for upper body when all sets hit top reps at RPE <= 8', () => {
    const sets = [7, 7.5, 8].map((rpe, i) =>
      makeSet({ setNumber: i + 1, weightKg: 80, reps: 8, rpe }),
    );
    const result = suggestProgression(input({ lastSets: sets }));
    expect(result.action).toBe('increase_load');
    // 80 * 1.025 = 82 -> rounds to 82.5 (barbell increment)
    expect(result.nextWeightKg).toBe(82.5);
    expect(result.rationale).toMatch(/top of the rep range/i);
  });

  it('suggests +5% for lower-body compound patterns', () => {
    const sets = [7, 7, 7].map((rpe, i) =>
      makeSet({ setNumber: i + 1, weightKg: 140, reps: 8, rpe }),
    );
    const result = suggestProgression(
      input({
        exercise: { equipment: [...squat.equipment], movementPattern: squat.movementPattern },
        lastSets: sets,
      }),
    );
    expect(result.action).toBe('increase_load');
    // 140 * 1.05 = 147 -> rounds to 147.5
    expect(result.nextWeightKg).toBe(147.5);
  });

  it('guarantees at least one increment when percentage rounds to zero', () => {
    const sets = [6, 6, 6].map((rpe, i) =>
      makeSet({ setNumber: i + 1, weightKg: 20, reps: 8, rpe }),
    );
    const result = suggestProgression(input({ lastSets: sets }));
    expect(result.action).toBe('increase_load');
    expect(result.nextWeightKg).toBeGreaterThan(20);
  });

  it('suggests more reps (double progression) mid rep-range at easy effort', () => {
    const sets = [7, 7, 7].map((rpe, i) =>
      makeSet({ setNumber: i + 1, weightKg: 80, reps: 7, rpe }),
    );
    const result = suggestProgression(input({ lastSets: sets }));
    expect(result.action).toBe('increase_reps');
    expect(result.nextWeightKg).toBe(80);
    expect(result.rationale).toMatch(/double progression/i);
  });

  it('holds when targets were met but effort was near-max', () => {
    const sets = [9, 9, 9].map((rpe, i) =>
      makeSet({ setNumber: i + 1, weightKg: 80, reps: 8, rpe }),
    );
    const result = suggestProgression(input({ lastSets: sets }));
    expect(result.action).toBe('hold');
    expect(result.nextWeightKg).toBe(80);
  });

  it('reduces load ~5% after missed reps', () => {
    const sets = [
      makeSet({ setNumber: 1, weightKg: 80, reps: 6, rpe: 9 }),
      makeSet({ setNumber: 2, weightKg: 80, reps: 5, rpe: 10 }),
      makeSet({ setNumber: 3, weightKg: 80, reps: 4, rpe: 10 }),
    ];
    const result = suggestProgression(input({ lastSets: sets }));
    expect(result.action).toBe('reduce_load');
    expect(result.nextWeightKg).toBeLessThan(80);
    expect(result.rationale).toMatch(/missed/i);
  });

  it('reduces load when every set was at failure even if reps were hit', () => {
    const sets = [1, 2, 3].map((n) =>
      makeSet({ setNumber: n, weightKg: 80, reps: 8, isFailure: true }),
    );
    const result = suggestProgression(input({ lastSets: sets }));
    expect(result.action).toBe('reduce_load');
  });

  it('suggests a ~10% deload when stagnation is detected', () => {
    const history = [
      perf({ date: '2026-07-20', bestE1RmKg: 100, avgRpe: 8.5 }),
      perf({ date: '2026-07-27', bestE1RmKg: 100.5, avgRpe: 9 }),
      perf({ date: '2026-08-03', bestE1RmKg: 100, avgRpe: 9 }),
    ];
    const sets = [8, 9, 9].map((rpe, i) =>
      makeSet({ setNumber: i + 1, weightKg: 80, reps: 8, rpe }),
    );
    const result = suggestProgression(input({ lastSets: sets, history }));
    expect(result.action).toBe('deload');
    expect(result.nextWeightKg).toBeCloseTo(72.5, 5); // 90% of 80, rounded to 2.5
    expect(result.rationale).toMatch(/deload/i);
  });

  it('ignores warm-up sets entirely', () => {
    const sets = [
      makeSet({ setNumber: 0, weightKg: 40, reps: 12, isWarmup: true, rpe: 3 }),
      ...[7, 7, 7].map((rpe, i) => makeSet({ setNumber: i + 1, weightKg: 80, reps: 8, rpe })),
    ];
    const result = suggestProgression(input({ lastSets: sets }));
    expect(result.action).toBe('increase_load');
    expect(result.nextWeightKg).toBe(82.5);
  });

  it('progresses conservatively when no RPE was logged', () => {
    const sets = [1, 2, 3].map((n) => makeSet({ setNumber: n, weightKg: 80, reps: 8 }));
    const result = suggestProgression(input({ lastSets: sets }));
    expect(result.action).toBe('increase_load');
    expect(result.confidence).toBe('medium');
  });

  it('rounds suggestions in the user\u2019s display unit (lb plate math)', () => {
    const sets = [7, 7, 7].map((rpe, i) =>
      makeSet({ setNumber: i + 1, weightKg: 102.058, reps: 8, rpe }), // 225 lb
    );
    const result = suggestProgression(input({ lastSets: sets, unit: 'lb' }));
    expect(result.action).toBe('increase_load');
    // 225 lb * 1.025 = 230.6 -> 230 lb in 5 lb steps
    expect(Math.round(result.nextWeightKg / 0.45359237)).toBe(230);
  });
});

describe('detectStagnation', () => {
  it('requires at least 3 sessions', () => {
    expect(detectStagnation([perf({}), perf({})])).toBe(false);
  });

  it('flags flat e1RM with high average effort', () => {
    const history = [
      perf({ bestE1RmKg: 100, avgRpe: 8.5 }),
      perf({ bestE1RmKg: 100.2, avgRpe: 9 }),
      perf({ bestE1RmKg: 99.8, avgRpe: 9.5 }),
    ];
    expect(detectStagnation(history)).toBe(true);
  });

  it('does not flag a plateau at easy effort (user is coasting)', () => {
    const history = [
      perf({ bestE1RmKg: 100, avgRpe: 6 }),
      perf({ bestE1RmKg: 100, avgRpe: 6.5 }),
      perf({ bestE1RmKg: 100, avgRpe: 6 }),
    ];
    expect(detectStagnation(history)).toBe(false);
  });

  it('does not flag genuine progress', () => {
    const history = [
      perf({ bestE1RmKg: 100, avgRpe: 9 }),
      perf({ bestE1RmKg: 103, avgRpe: 9 }),
      perf({ bestE1RmKg: 105, avgRpe: 9 }),
    ];
    expect(detectStagnation(history)).toBe(false);
  });

  it('only considers the most recent window', () => {
    const history = [
      perf({ bestE1RmKg: 80, avgRpe: 7 }),
      perf({ bestE1RmKg: 100, avgRpe: 9 }),
      perf({ bestE1RmKg: 100.1, avgRpe: 9 }),
      perf({ bestE1RmKg: 100, avgRpe: 9 }),
    ];
    expect(detectStagnation(history)).toBe(true);
  });
});

describe('helpers', () => {
  it('averageRpe uses effective RPE including failure tags', () => {
    const sets = [
      makeSet({ rpe: 8 }),
      makeSet({ rir: 2 }), // -> RPE 8
      makeSet({ isFailure: true }), // -> RPE 10
    ];
    expect(averageRpe(sets)).toBeCloseTo(26 / 3, 5);
  });

  it('buildSessionPerformance summarizes a finished exercise', () => {
    const sets = [
      makeSet({ weightKg: 60, reps: 10, isWarmup: true }),
      makeSet({ weightKg: 100, reps: 8, rpe: 8 }),
      makeSet({ weightKg: 100, reps: 7, rpe: 9 }),
      makeSet({ weightKg: 100, reps: 6, rpe: 9.5 }),
    ];
    const result = buildSessionPerformance(sets, prescription, '2026-08-10');
    expect(result.completedAllTargets).toBe(true);
    expect(result.bestE1RmKg).toBeCloseTo(126.667, 2);
    expect(result.avgRpe).toBeCloseTo(8.833, 2);
  });
});

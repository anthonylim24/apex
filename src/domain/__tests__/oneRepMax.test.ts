import { bestSessionE1Rm, epley1Rm, weightForReps } from '../oneRepMax';
import { makeSet } from './factories';

describe('epley1Rm', () => {
  it('returns the weight itself for a single', () => {
    expect(epley1Rm(140, 1)).toBe(140);
  });

  it('computes Epley for typical rep counts', () => {
    // 100 kg x 8 => 100 * (1 + 8/30) = 126.67
    expect(epley1Rm(100, 8)).toBeCloseTo(126.667, 2);
    expect(epley1Rm(80, 5)).toBeCloseTo(93.333, 2);
  });

  it('caps reps at 12 to avoid inflated high-rep estimates', () => {
    expect(epley1Rm(50, 20)).toBe(epley1Rm(50, 12));
  });

  it('returns 0 for degenerate input', () => {
    expect(epley1Rm(0, 5)).toBe(0);
    expect(epley1Rm(100, 0)).toBe(0);
  });
});

describe('bestSessionE1Rm', () => {
  it('ignores warm-ups and picks the best working set', () => {
    const sets = [
      makeSet({ weightKg: 60, reps: 10, isWarmup: true }),
      makeSet({ weightKg: 100, reps: 5 }),
      makeSet({ weightKg: 90, reps: 10 }),
    ];
    // 100x5 => 116.67; 90x10 => 120 — the 10-rep set wins.
    expect(bestSessionE1Rm(sets)).toBeCloseTo(120, 5);
  });
});

describe('weightForReps', () => {
  it('inverts Epley', () => {
    const e1Rm = epley1Rm(100, 8);
    expect(weightForReps(e1Rm, 8)).toBeCloseTo(100, 5);
    expect(weightForReps(120, 1)).toBe(120);
  });
});

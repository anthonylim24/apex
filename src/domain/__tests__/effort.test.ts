import { effectiveRpe, rirToRpe, rpeLabel, rpeToRir } from '../effort';

describe('RPE/RIR conversion', () => {
  it('maps RIR to RPE and back', () => {
    expect(rirToRpe(0)).toBe(10);
    expect(rirToRpe(2)).toBe(8);
    expect(rpeToRir(10)).toBe(0);
    expect(rpeToRir(7)).toBe(3);
  });

  it('clamps out-of-range values', () => {
    expect(rirToRpe(15)).toBe(1);
    expect(rpeToRir(12)).toBe(0);
  });
});

describe('effectiveRpe', () => {
  it('treats failure-tagged sets as RPE 10', () => {
    expect(effectiveRpe({ rpe: 7, isFailure: true })).toBe(10);
  });

  it('prefers logged RPE, falls back to RIR, else undefined', () => {
    expect(effectiveRpe({ rpe: 8, rir: 4, isFailure: false })).toBe(8);
    expect(effectiveRpe({ rir: 3, isFailure: false })).toBe(7);
    expect(effectiveRpe({ isFailure: false })).toBeUndefined();
  });
});

describe('rpeLabel', () => {
  it('describes effort in plain language', () => {
    expect(rpeLabel(10)).toMatch(/nothing left/i);
    expect(rpeLabel(8)).toMatch(/2 reps left/i);
  });
});

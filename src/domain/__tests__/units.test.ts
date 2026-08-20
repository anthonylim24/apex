import {
  formatWeight,
  fromDisplayWeight,
  kgToLb,
  lbToKg,
  roundToIncrement,
  smallestIncrement,
  toDisplayWeight,
} from '../units';

describe('unit conversion', () => {
  it('round-trips kg <-> lb', () => {
    expect(lbToKg(kgToLb(100))).toBeCloseTo(100, 10);
    expect(kgToLb(20)).toBeCloseTo(44.0925, 3);
  });

  it('display conversion respects the profile unit', () => {
    expect(toDisplayWeight(100, 'kg')).toBe(100);
    expect(toDisplayWeight(100, 'lb')).toBeCloseTo(220.462, 2);
    expect(fromDisplayWeight(225, 'lb')).toBeCloseTo(102.058, 2);
    expect(fromDisplayWeight(102.5, 'kg')).toBe(102.5);
  });

  it('rounds to plate increments', () => {
    expect(roundToIncrement(81.7, 2.5)).toBe(82.5);
    expect(roundToIncrement(81.1, 2.5)).toBe(80);
    expect(roundToIncrement(226, 5)).toBe(225);
    expect(roundToIncrement(50, 0)).toBe(50);
  });

  it('derives the smallest increment from equipment and unit', () => {
    expect(smallestIncrement(['barbell', 'bench'], 'kg')).toBe(2.5);
    expect(smallestIncrement(['barbell', 'bench'], 'lb')).toBe(5);
    expect(smallestIncrement(['dumbbell'], 'kg')).toBe(2);
    expect(smallestIncrement(['machine'], 'kg')).toBe(2.5);
    expect(smallestIncrement(['bodyweight'], 'kg')).toBe(1);
    expect(smallestIncrement(['bodyweight'], 'lb')).toBe(2.5);
  });

  it('formats weights without trailing zeros', () => {
    expect(formatWeight(80, 'kg')).toBe('80 kg');
    expect(formatWeight(22.5, 'kg')).toBe('22.5 kg');
    expect(formatWeight(102.058, 'lb')).toBe('225 lb');
  });
});

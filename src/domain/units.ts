import type { Equipment, Unit } from './types';

export const KG_PER_LB = 0.45359237;

export const kgToLb = (kg: number): number => kg / KG_PER_LB;
export const lbToKg = (lb: number): number => lb * KG_PER_LB;

/** Convert a canonical kg value into the user's display unit. */
export const toDisplayWeight = (kg: number, unit: Unit): number =>
  unit === 'kg' ? kg : kgToLb(kg);

/** Convert a user-entered value in their display unit back to canonical kg. */
export const fromDisplayWeight = (value: number, unit: Unit): number =>
  unit === 'kg' ? value : lbToKg(value);

/** Round to the given increment (e.g. plate math: 2.5 kg, 5 lb). */
export const roundToIncrement = (value: number, increment: number): number => {
  if (increment <= 0) return value;
  return Math.round(value / increment) * increment;
};

/**
 * Smallest realistic load step per equipment type, in the user's unit.
 * Used both for steppers in the SetLogger and for progression rounding.
 */
export const smallestIncrement = (equipment: Equipment[], unit: Unit): number => {
  const kgIncrement = equipment.includes('dumbbell') || equipment.includes('kettlebell')
    ? 2 // typical dumbbell rack jump
    : equipment.includes('machine') || equipment.includes('cable')
      ? 2.5 // weight-stack pin
      : equipment.includes('barbell')
        ? 2.5 // 1.25 kg plate per side
        : 1; // bodyweight/band: assisted or added load, allow fine steps
  if (unit === 'kg') return kgIncrement;
  // Mirror common lb plate math rather than converting exactly.
  return kgIncrement <= 1 ? 2.5 : 5;
};

/** Format a weight for display, trimming trailing zeros ("80", "22.5"). */
export const formatWeight = (kg: number, unit: Unit): string => {
  const value = toDisplayWeight(kg, unit);
  const rounded = Math.round(value * 10) / 10;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)} ${unit}`;
};

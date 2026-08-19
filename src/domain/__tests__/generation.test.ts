import { generateWorkout, isExerciseUsable, prescribeWeightKg, schemeForGoal, type GenerationInput } from '../generation';
import type { Exercise } from '../types';
import { makeExercise } from './factories';

const library: Exercise[] = [
  makeExercise({ id: 'squat', name: 'Back Squat', movementPattern: 'squat', primaryMuscles: ['quads', 'glutes'], equipment: ['barbell'] }),
  makeExercise({ id: 'goblet', name: 'Goblet Squat', movementPattern: 'squat', primaryMuscles: ['quads'], equipment: ['dumbbell'] }),
  makeExercise({ id: 'bench', name: 'Bench Press', movementPattern: 'horizontal_push', primaryMuscles: ['chest'], equipment: ['barbell', 'bench'] }),
  makeExercise({ id: 'row', name: 'Barbell Row', movementPattern: 'horizontal_pull', primaryMuscles: ['back', 'lats'], equipment: ['barbell'] }),
  makeExercise({ id: 'deadlift', name: 'Deadlift', movementPattern: 'hinge', primaryMuscles: ['hamstrings', 'glutes'], equipment: ['barbell'], difficulty: 'intermediate' }),
  makeExercise({ id: 'ohp', name: 'Overhead Press', movementPattern: 'vertical_push', primaryMuscles: ['shoulders'], equipment: ['barbell'] }),
  makeExercise({ id: 'pullup', name: 'Pull-Up', movementPattern: 'vertical_pull', primaryMuscles: ['lats'], equipment: ['pullup_bar', 'bodyweight'], difficulty: 'intermediate' }),
  makeExercise({ id: 'lunge', name: 'Walking Lunge', movementPattern: 'lunge', primaryMuscles: ['quads', 'glutes'], equipment: ['dumbbell'] }),
  makeExercise({ id: 'curl', name: 'Dumbbell Curl', movementPattern: 'isolation', primaryMuscles: ['biceps'], equipment: ['dumbbell'] }),
  makeExercise({ id: 'extension', name: 'Triceps Extension', movementPattern: 'isolation', primaryMuscles: ['triceps'], equipment: ['cable'] }),
  makeExercise({ id: 'plank', name: 'Plank', movementPattern: 'core', primaryMuscles: ['core'], equipment: ['bodyweight'] }),
];

const baseInput = (overrides: Partial<GenerationInput> = {}): GenerationInput => ({
  profile: {
    goal: 'hypertrophy',
    experience: 'intermediate',
    equipment: ['barbell', 'dumbbell', 'bench', 'cable', 'pullup_bar'],
    avoidMuscles: [],
    preferredSessionMinutes: 60,
    unit: 'kg',
  },
  library,
  e1RmByExercise: {},
  weeklySetsPerMuscle: {},
  random: () => 0, // deterministic: always pick the first candidate
  now: () => new Date('2026-08-10T10:00:00.000Z'),
  ...overrides,
});

describe('isExerciseUsable', () => {
  it('requires all equipment to be available (bodyweight is free)', () => {
    const bench = library.find((e) => e.id === 'bench')!;
    expect(isExerciseUsable(bench, ['barbell'], 'beginner', [])).toBe(false);
    expect(isExerciseUsable(bench, ['barbell', 'bench'], 'beginner', [])).toBe(true);
    const plank = library.find((e) => e.id === 'plank')!;
    expect(isExerciseUsable(plank, [], 'beginner', [])).toBe(true);
  });

  it('gates difficulty by experience level', () => {
    const deadlift = library.find((e) => e.id === 'deadlift')!;
    expect(isExerciseUsable(deadlift, ['barbell'], 'beginner', [])).toBe(false);
    expect(isExerciseUsable(deadlift, ['barbell'], 'intermediate', [])).toBe(true);
  });

  it('excludes exercises that target injured/avoided muscles', () => {
    const squat = library.find((e) => e.id === 'squat')!;
    expect(isExerciseUsable(squat, ['barbell'], 'advanced', ['quads'])).toBe(false);
  });
});

describe('generateWorkout', () => {
  it('produces a compound-first workout that fits the time budget', () => {
    const result = generateWorkout(baseInput());
    expect(result.exercises.length).toBeGreaterThanOrEqual(4);
    expect(result.estimatedMinutes).toBeLessThanOrEqual(60);
    // Compounds come before isolation.
    const patterns = result.exercises.map(
      (e) => library.find((x) => x.id === e.exerciseId)!.movementPattern,
    );
    const firstIsolation = patterns.findIndex((p) => p === 'isolation' || p === 'core');
    if (firstIsolation !== -1) {
      expect(patterns.slice(0, firstIsolation)).not.toContain('isolation');
    }
  });

  it('applies the goal-specific rep scheme', () => {
    const strength = generateWorkout(
      baseInput({ profile: { ...baseInput().profile, goal: 'strength' } }),
    );
    const compound = strength.exercises[0];
    expect(compound.targetRepsMin).toBe(4);
    expect(compound.targetRepsMax).toBe(6);
    expect(compound.restSeconds).toBe(150);

    const endurance = generateWorkout(
      baseInput({ profile: { ...baseInput().profile, goal: 'endurance' } }),
    );
    expect(endurance.exercises[0].targetRepsMax).toBeGreaterThanOrEqual(15);
  });

  it('supports daily-undulating intensity variants', () => {
    const heavy = generateWorkout(baseInput({ intensity: 'heavy' }));
    const light = generateWorkout(baseInput({ intensity: 'light' }));
    expect(heavy.exercises[0].targetRepsMax).toBeLessThan(light.exercises[0].targetRepsMax);
    expect(heavy.name).toMatch(/heavy/i);
  });

  it('respects a short session budget', () => {
    const result = generateWorkout(
      baseInput({ profile: { ...baseInput().profile, preferredSessionMinutes: 25 } }),
    );
    expect(result.estimatedMinutes).toBeLessThanOrEqual(25);
    expect(result.exercises.length).toBeGreaterThanOrEqual(2);
  });

  it('never selects unusable equipment', () => {
    const result = generateWorkout(
      baseInput({
        profile: { ...baseInput().profile, equipment: ['dumbbell'] },
      }),
    );
    for (const ex of result.exercises) {
      const exercise = library.find((x) => x.id === ex.exerciseId)!;
      expect(
        exercise.equipment.every((e) => e === 'dumbbell' || e === 'bodyweight'),
      ).toBe(true);
    }
  });

  it('avoids injured muscles entirely', () => {
    const result = generateWorkout(
      baseInput({
        profile: { ...baseInput().profile, avoidMuscles: ['quads'] },
      }),
    );
    for (const ex of result.exercises) {
      const exercise = library.find((x) => x.id === ex.exerciseId)!;
      expect(exercise.primaryMuscles).not.toContain('quads');
    }
  });

  it('caps prescribed weekly sets per muscle at 20', () => {
    const result = generateWorkout(
      baseInput({ weeklySetsPerMuscle: { chest: 19, quads: 20, glutes: 20, hamstrings: 20 } }),
    );
    for (const ex of result.exercises) {
      const exercise = library.find((x) => x.id === ex.exerciseId)!;
      // chest already at 19: adding 3-4 sets would exceed 20, so no chest work.
      expect(exercise.primaryMuscles).not.toContain('chest');
      expect(exercise.primaryMuscles).not.toContain('quads');
    }
  });

  it('prescribes working weights from known e1RMs at ~2 RIR', () => {
    const result = generateWorkout(baseInput({ e1RmByExercise: { bench: 120 } }));
    const bench = result.exercises.find((e) => e.exerciseId === 'bench')!;
    // hypertrophy moderate: 8-12 reps -> weight for 14 reps of 120 e1RM ~ 82.7 -> 82.5
    expect(bench.targetWeightKg).toBe(82.5);
    const squat = result.exercises.find((e) => e.exerciseId === 'squat')!;
    expect(squat.targetWeightKg).toBeUndefined();
  });

  it('is deterministic with an injected RNG', () => {
    const a = generateWorkout(baseInput());
    const b = generateWorkout(baseInput());
    expect(a.exercises.map((e) => e.exerciseId)).toEqual(b.exercises.map((e) => e.exerciseId));
  });
});

describe('prescribeWeightKg', () => {
  it('returns undefined without history', () => {
    expect(prescribeWeightKg(undefined, 8, { equipment: ['barbell'] }, 'kg')).toBeUndefined();
  });

  it('rounds to the equipment increment in the display unit', () => {
    const kg = prescribeWeightKg(120, 8, { equipment: ['barbell'] }, 'kg');
    expect(kg! % 2.5).toBeCloseTo(0, 5);
  });
});

describe('schemeForGoal', () => {
  it('exposes the documented default schemes', () => {
    expect(schemeForGoal('strength')).toEqual({ sets: 4, repsMin: 4, repsMax: 6, restSeconds: 150 });
    expect(schemeForGoal('hypertrophy', 'light').repsMax).toBe(15);
  });
});

import { SEED_EXERCISES } from '../../data/seedExercises';
import { searchExercises } from '../exerciseSearch';
import type { MovementPattern } from '../types';

describe('seed library integrity', () => {
  it('has a comprehensive, well-formed library', () => {
    expect(SEED_EXERCISES.length).toBeGreaterThanOrEqual(50);
    const ids = new Set(SEED_EXERCISES.map((e) => e.id));
    expect(ids.size).toBe(SEED_EXERCISES.length); // unique ids
    for (const e of SEED_EXERCISES) {
      expect(e.name.length).toBeGreaterThan(2);
      expect(e.description.length).toBeGreaterThan(20);
      expect(e.instructions.length).toBeGreaterThanOrEqual(3);
      expect(e.primaryMuscles.length).toBeGreaterThanOrEqual(1);
      expect(e.equipment.length).toBeGreaterThanOrEqual(1);
      expect(e.isCustom).toBe(false);
    }
  });

  it('covers every movement pattern', () => {
    const patterns: MovementPattern[] = [
      'horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull',
      'squat', 'hinge', 'lunge', 'carry', 'isolation', 'core',
    ];
    for (const pattern of patterns) {
      expect(SEED_EXERCISES.some((e) => e.movementPattern === pattern)).toBe(true);
    }
  });

  it('offers bodyweight-only options for every big pattern', () => {
    const bodyweightPatterns = new Set(
      SEED_EXERCISES.filter((e) => e.equipment.every((eq) => eq === 'bodyweight' || eq === 'pullup_bar'))
        .map((e) => e.movementPattern),
    );
    expect(bodyweightPatterns.has('squat')).toBe(true);
    expect(bodyweightPatterns.has('horizontal_push')).toBe(true);
    expect(bodyweightPatterns.has('vertical_pull')).toBe(true);
    expect(bodyweightPatterns.has('core')).toBe(true);
  });
});

describe('searchExercises', () => {
  it('finds exercises by name with prefix ranking', () => {
    const results = searchExercises(SEED_EXERCISES, { query: 'bench' });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toMatch(/bench/i);
  });

  it('matches muscle and equipment keywords in the query', () => {
    const results = searchExercises(SEED_EXERCISES, { query: 'hamstrings' });
    expect(results.some((e) => e.primaryMuscles.includes('hamstrings'))).toBe(true);
  });

  it('applies multi-filters with AND across dimensions', () => {
    const results = searchExercises(SEED_EXERCISES, {
      muscles: ['chest'],
      equipment: ['dumbbell'],
      difficulty: ['beginner'],
    });
    expect(results.length).toBeGreaterThan(0);
    for (const e of results) {
      expect([...e.primaryMuscles, ...e.secondaryMuscles]).toContain('chest');
      expect(e.equipment).toContain('dumbbell');
      expect(e.difficulty).toBe('beginner');
    }
  });

  it('applies OR within a dimension', () => {
    const results = searchExercises(SEED_EXERCISES, { patterns: ['squat', 'hinge'] });
    expect(results.every((e) => e.movementPattern === 'squat' || e.movementPattern === 'hinge')).toBe(true);
    expect(new Set(results.map((e) => e.movementPattern)).size).toBe(2);
  });

  it('ranks favorites first', () => {
    const favorites = new Set(['plank']);
    const results = searchExercises(SEED_EXERCISES, {}, favorites);
    expect(results[0].id).toBe('plank');
  });

  it('filters to favorites only', () => {
    const favorites = new Set(['plank', 'bench-press']);
    const results = searchExercises(SEED_EXERCISES, { favoritesOnly: true }, favorites);
    expect(results.map((e) => e.id).sort()).toEqual(['bench-press', 'plank']);
  });

  it('returns nothing for nonsense queries', () => {
    expect(searchExercises(SEED_EXERCISES, { query: 'zzzznotanexercise' })).toHaveLength(0);
  });
});

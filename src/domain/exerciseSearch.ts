import type { Difficulty, Equipment, Exercise, MovementPattern, MuscleGroup } from './types';

export interface ExerciseFilters {
  query?: string;
  muscles?: MuscleGroup[];
  equipment?: Equipment[];
  difficulty?: Difficulty[];
  patterns?: MovementPattern[];
  favoritesOnly?: boolean;
}

const normalize = (text: string): string => text.toLowerCase().trim();

/** Rank a text match: exact prefix beats word prefix beats substring. */
const matchScore = (exercise: Exercise, query: string): number => {
  const name = normalize(exercise.name);
  if (name.startsWith(query)) return 3;
  if (name.split(/\s+/).some((word) => word.startsWith(query))) return 2;
  if (name.includes(query)) return 1;
  const haystack = [
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
    exercise.movementPattern,
    ...exercise.equipment,
  ]
    .join(' ')
    .replace(/_/g, ' ');
  if (haystack.includes(query)) return 0.5;
  return 0;
};

/**
 * Search + multi-filter the exercise library. Filters combine with AND
 * across dimensions and OR within a dimension. Results are ranked by
 * favorites first, then match quality, then name.
 */
export const searchExercises = (
  library: Exercise[],
  filters: ExerciseFilters,
  favoriteIds: ReadonlySet<string> = new Set(),
): Exercise[] => {
  const query = filters.query ? normalize(filters.query) : '';
  const scored = library
    .map((exercise) => ({ exercise, score: query ? matchScore(exercise, query) : 1 }))
    .filter(({ exercise, score }) => {
      if (query && score === 0) return false;
      if (filters.favoritesOnly && !favoriteIds.has(exercise.id)) return false;
      if (
        filters.muscles?.length &&
        !filters.muscles.some(
          (m) => exercise.primaryMuscles.includes(m) || exercise.secondaryMuscles.includes(m),
        )
      ) {
        return false;
      }
      if (
        filters.equipment?.length &&
        !filters.equipment.some((e) => exercise.equipment.includes(e))
      ) {
        return false;
      }
      if (filters.difficulty?.length && !filters.difficulty.includes(exercise.difficulty)) {
        return false;
      }
      if (filters.patterns?.length && !filters.patterns.includes(exercise.movementPattern)) {
        return false;
      }
      return true;
    });

  return scored
    .sort((a, b) => {
      const favDiff =
        Number(favoriteIds.has(b.exercise.id)) - Number(favoriteIds.has(a.exercise.id));
      if (favDiff !== 0) return favDiff;
      if (b.score !== a.score) return b.score - a.score;
      return a.exercise.name.localeCompare(b.exercise.name);
    })
    .map(({ exercise }) => exercise);
};

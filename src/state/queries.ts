import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SEED_EXERCISES } from '../data/seedExercises';
import type { Exercise, Profile, WorkoutSession } from '../domain/types';
import { useRepository } from './appContext';

/** TanStack Query hooks over the offline-first repository. Every read is
 * local (instant); mutations write locally then trigger background sync. */

const keys = {
  profile: (userId: string) => ['profile', userId] as const,
  sessions: (userId: string) => ['sessions', userId] as const,
  favorites: (userId: string) => ['favorites', userId] as const,
  customExercises: (userId: string) => ['customExercises', userId] as const,
};

export const useProfile = () => {
  const repo = useRepository();
  return useQuery({
    queryKey: keys.profile(repo.userId),
    queryFn: async () => (await repo.getProfile()) ?? null,
  });
};

export const useSaveProfile = () => {
  const repo = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (profile: Profile) => repo.saveProfile(profile),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.profile(repo.userId) });
      void repo.sync();
    },
  });
};

export const useSessions = () => {
  const repo = useRepository();
  return useQuery({
    queryKey: keys.sessions(repo.userId),
    queryFn: () => repo.listSessions(),
  });
};

export const useSaveSession = () => {
  const repo = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (session: WorkoutSession) => repo.saveSession(session),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.sessions(repo.userId) });
      void repo.sync();
    },
  });
};

export const useFavorites = () => {
  const repo = useRepository();
  return useQuery({
    queryKey: keys.favorites(repo.userId),
    queryFn: () => repo.listFavoriteIds(),
  });
};

export const useToggleFavorite = () => {
  const repo = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) => repo.toggleFavorite(exerciseId),
    // Optimistic: favorites flip instantly even offline.
    onMutate: async (exerciseId) => {
      await client.cancelQueries({ queryKey: keys.favorites(repo.userId) });
      const previous = client.getQueryData<string[]>(keys.favorites(repo.userId)) ?? [];
      client.setQueryData<string[]>(
        keys.favorites(repo.userId),
        previous.includes(exerciseId)
          ? previous.filter((id) => id !== exerciseId)
          : [...previous, exerciseId],
      );
      return { previous };
    },
    onError: (_error, _exerciseId, context) => {
      if (context) client.setQueryData(keys.favorites(repo.userId), context.previous);
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: keys.favorites(repo.userId) });
      void repo.sync();
    },
  });
};

export const useCustomExercises = () => {
  const repo = useRepository();
  return useQuery({
    queryKey: keys.customExercises(repo.userId),
    queryFn: () => repo.listCustomExercises(),
  });
};

export const useSaveCustomExercise = () => {
  const repo = useRepository();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (exercise: Exercise) => repo.saveCustomExercise(exercise),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: keys.customExercises(repo.userId) });
      void repo.sync();
    },
  });
};

/** Seed library + the user's custom exercises, id-indexed. */
export const useExerciseLibrary = (): {
  exercises: Exercise[];
  byId: Record<string, Exercise>;
  isLoading: boolean;
} => {
  const custom = useCustomExercises();
  const exercises = useMemo(
    () => [...SEED_EXERCISES, ...(custom.data ?? [])],
    [custom.data],
  );
  const byId = useMemo(
    () => Object.fromEntries(exercises.map((e) => [e.id, e])),
    [exercises],
  );
  return { exercises, byId, isLoading: custom.isLoading };
};

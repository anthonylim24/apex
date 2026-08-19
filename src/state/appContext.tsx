import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useAuthSession } from '../auth/auth';
import { Repository } from '../data/repository';
import { asyncKeyValueStore } from '../data/storage';
import { createSupabaseClient, readSupabaseEnv, SupabaseRemote } from '../data/supabase';

const RepositoryContext = createContext<Repository | undefined>(undefined);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Local storage is the source of truth — reads are cheap, so keep
      // data fresh across screens without refetch spinners.
      staleTime: 5_000,
      retry: 1,
    },
  },
});

const SYNC_INTERVAL_MS = 30_000;

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuthSession();
  const userId = auth.userId ?? 'anonymous';

  const repository = useMemo(() => {
    const supabaseEnv = readSupabaseEnv();
    const remote =
      supabaseEnv && auth.mode === 'clerk'
        ? new SupabaseRemote(
            createSupabaseClient({ ...supabaseEnv, getClerkToken: auth.getToken }),
          )
        : undefined;
    return new Repository(asyncKeyValueStore, userId, remote);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recreate only per user
  }, [userId, auth.mode]);

  // Background sync: opportunistic, silent, never blocks the UI.
  useEffect(() => {
    let cancelled = false;
    const run = (): void => {
      if (!cancelled) void repository.sync();
    };
    run();
    const interval = setInterval(run, SYNC_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [repository]);

  return (
    <RepositoryContext.Provider value={repository}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </RepositoryContext.Provider>
  );
};

export const useRepository = (): Repository => {
  const repo = useContext(RepositoryContext);
  if (!repo) throw new Error('useRepository must be used inside AppProviders');
  return repo;
};

import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';

/**
 * Authentication: Clerk when EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set;
 * otherwise a fully offline "local mode" (single on-device user, no
 * network). Local mode keeps every core flow — logging, progression,
 * history — usable and testable without credentials, and is the
 * graceful-degradation path if Clerk is ever unreachable.
 */

export const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

export interface AuthSession {
  userId: string | undefined;
  isLoaded: boolean;
  isSignedIn: boolean;
  mode: 'clerk' | 'local';
  displayName?: string;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const LOCAL_SESSION: AuthSession = {
  userId: 'local-user',
  isLoaded: true,
  isSignedIn: true,
  mode: 'local',
  displayName: undefined,
  getToken: async () => null,
  signOut: async () => undefined,
};

const LocalAuthContext = createContext<AuthSession>(LOCAL_SESSION);

/** Secure token cache for Clerk (SecureStore on native, memory on web —
 * Clerk manages its own web persistence via cookies). */
const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return;
    await SecureStore.setItemAsync(key, value);
  },
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        {children}
      </ClerkProvider>
    );
  }
  return <LocalAuthContext.Provider value={LOCAL_SESSION}>{children}</LocalAuthContext.Provider>;
};

const useClerkSession = (): AuthSession => {
  const { isLoaded, isSignedIn, userId, getToken, signOut } = useAuth();
  const { user } = useUser();
  return {
    userId: userId ?? undefined,
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    mode: 'clerk',
    displayName: user?.firstName ?? user?.username ?? undefined,
    getToken: () => getToken(),
    signOut: async () => {
      await signOut();
    },
  };
};

const useLocalSession = (): AuthSession => useContext(LocalAuthContext);

/** Single auth hook for the whole app, valid in both modes. */
export const useAuthSession: () => AuthSession = clerkPublishableKey
  ? useClerkSession
  : useLocalSession;

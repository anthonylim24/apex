import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuthSession } from '@/auth/auth';
import { useProfile } from '@/state/queries';
import { colors } from '@/ui/theme';

/** Entry gate: sign-in (Clerk mode) → onboarding (no profile) → app. */
export default function Index() {
  const auth = useAuthSession();
  const profile = useProfile();

  if (!auth.isLoaded || profile.isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }
  if (auth.mode === 'clerk' && !auth.isSignedIn) {
    return <Redirect href="/sign-in" />;
  }
  if (!profile.data?.onboardingCompletedAt) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}

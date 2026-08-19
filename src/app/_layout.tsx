import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/auth/auth';
import { AppProviders } from '@/state/appContext';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppProviders>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: 'fade_from_bottom',
                animationDuration: 200,
              }}
            >
              <Stack.Screen name="workout/player" options={{ gestureEnabled: false }} />
            </Stack>
          </AppProviders>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import { Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';
import { AppText } from '@/ui/components/primitives';
import { colors } from '@/ui/theme';

const TabIcon = ({ glyph, color }: { glyph: string; color: ColorValue }) => (
  <AppText variant="heading" color={color}>
    {glyph}
  </AppText>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => <TabIcon glyph="▶" color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => <TabIcon glyph="≡" color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <TabIcon glyph="◈" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon glyph="●" color={color} />,
        }}
      />
    </Tabs>
  );
}

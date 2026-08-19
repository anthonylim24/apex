import { Tabs } from 'expo-router';
import React from 'react';
import { LibraryTabIcon, ProfileTabIcon, ProgressTabIcon, TrainTabIcon } from '@/ui/components/tabIcons';
import { colors, fonts } from '@/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.surfaceOutline,
          height: 64,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: fonts.display,
          fontSize: 11,
          fontWeight: '400',
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => <TrainTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Exercises',
          tabBarIcon: ({ color }) => <LibraryTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <ProgressTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <ProfileTabIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

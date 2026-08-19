import { Tabs } from 'expo-router';
import React from 'react';
import { LibraryTabIcon, ProfileTabIcon, ProgressTabIcon, TrainTabIcon } from '@/ui/components/tabIcons';
import { clay } from '@/ui/clay';
import { colors, fonts } from '@/ui/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 76,
          paddingTop: 10,
          ...clay.dock,
        },
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: fonts.ui,
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.6,
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

import { Tabs } from 'expo-router';
import React from 'react';



import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF8C42',
        headerShown: false,
        tabBarButton: HapticTab,
      }}>

      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

       <Tabs.Screen
        name="pets"
        options={{
          title: 'My pets',
          tabBarIcon: ({ color }) => <FontAwesome name="paw" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <FontAwesome name="calendar" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistics',
          tabBarIcon: ({ color }) => <FontAwesome name="bar-chart" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <FontAwesome name="cog" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="my_account"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="set_notification"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="notification"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="language"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="edit_profile"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="add_pet"
        options={{
          href: null,
        }}
      />




    </Tabs>


  );
}

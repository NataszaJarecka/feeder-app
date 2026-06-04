import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../firebaseConfig';

import { Colors } from '../constants/Colors';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { getUserThemePreference } from '../services/userService';

import { registerForPushNotificationsAsync } from '../services/notificationService';

function RootLayoutContent() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  const { currentTheme, setThemeMode } = useAppTheme();
  const currentColors = Colors[currentTheme];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const savedTheme = await getUserThemePreference();
        setThemeMode(savedTheme);


        try {
          await registerForPushNotificationsAsync();
        } catch (pushError) {
          console.warn('Nie udało się automatycznie zarejestrować powiadomień push:', pushError);
        }
      } else {
        setThemeMode('system');
      }

      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/auth_screen');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/pets');
    }
  }, [user, segments, initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: currentColors.background }}>
        <ActivityIndicator size="large" color={currentColors.tint} />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
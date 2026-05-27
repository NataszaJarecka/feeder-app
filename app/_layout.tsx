import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { auth } from '../firebaseConfig';

// Importy naszego systemu motywów
import { Colors } from '../constants/Colors';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { getUserThemePreference } from '../services/userService';

// ZMIANA: Import funkcji automatycznie generującej token powiadomień
import { registerForPushNotificationsAsync } from '../services/notificationService';

function RootLayoutContent() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // Pobieramy wartości z naszego kontekstu motywów
  const { currentTheme, setThemeMode } = useAppTheme();
  const currentColors = Colors[currentTheme];

  // 1. Słuchamy zmian w Firebase (Autoryzacja + pobranie Motywu z bazy + Automatyczny Token Push)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Użytkownik jest zalogowany -> wyciągamy jego motyw z Firestore
        const savedTheme = await getUserThemePreference();
        setThemeMode(savedTheme);

        // ZMIANA: Wywołujemy pobranie tokenu push. Gdy użytkownik wejdzie do aplikacji jako zalogowany,
        // token sprawdzi się i po cichu zapisze/zaktualizuje w jego dokumencie w bazie.
        try {
          await registerForPushNotificationsAsync();
        } catch (pushError) {
          console.warn('Nie udało się automatycznie zarejestrować powiadomień push:', pushError);
        }
      } else {
        // Niezalogowany -> domyślnie tryb systemowy
        setThemeMode('system');
      }

      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // 2. Automatyczne przekierowania na bazie stanu zalogowania
  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/auth_screen');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/pets');
    }
  }, [user, segments, initializing]);

  // Ekran ładowania - teraz ma DYNAMICZNE tło i kolor kręciołka w zależności od motywu!
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: currentColors.background }}>
        <ActivityIndicator size="large" color={currentColors.tint} />
      </View>
    );
  }

  // Zwracamy naszą nawigację, owiniętą w natywny ThemeProvider dla paska stanu itp.
  return (
    <NavigationThemeProvider value={currentTheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
    </NavigationThemeProvider>
  );
}

// Główny komponent RootLayout dostarcza ThemeProvider do całego drzewa aplikacji
export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
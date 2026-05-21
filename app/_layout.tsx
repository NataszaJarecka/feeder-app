import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
// Importujemy auth z Twojego pliku konfiguracyjnego
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  // 1. Słuchamy zmian w Firebase (czy ktoś się zalogował/wylogował)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, []);

  // 2. Automatyczne przekierowania na bazie stanu zalogowania
  useEffect(() => {
    if (initializing) return;

    // Sprawdzamy, w którym folderze (grupie) znajduje się obecnie użytkownik
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // Brak użytkownika, a próbuje wejść głębiej -> kieruj do logowania
      router.replace('/(auth)/auth_screen');
    } else if (user && inAuthGroup) {
      // Użytkownik jest zalogowany, a siedzi na ekranie logowania -> wpuść go
      router.replace('/(tabs)/pets');
    }
  }, [user, segments, initializing]);

  // Ekran ładowania (kręciołek), zanim Firebase odpowie czy sesja istnieje
  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#E99664" />
      </View>
    );
  }

  return <Slot />;
}
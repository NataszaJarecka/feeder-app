import { createClient } from '@supabase/supabase-js';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signInWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

// 1. Inicjalizacja klienta Supabase z Twoimi danymi projektowymi
const SUPABASE_URL = 'https://skprsjpylwpktvczmrkl.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'sb_publishable_Vcp4dKaoMGZXteoWbY-q2A_FMg9sTcy';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Loguje użytkownika za pomocą Firebase Auth
 */
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
};

/**
 * Rejestruje nowego użytkownika, sprawdza unikalność loginu i tworzy profil w Firestore
 */
export const registerNewUser = async (email: string, password: string, username: string) => {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim();

  // 1. Sprawdzenie unikalności loginu
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', cleanUsername));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    throw new Error('USERNAME_TAKEN');
  }

  // 2. Tworzenie konta w Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;

  // 3. Zapis dokumentu w bazie Firestore z pustym polem deviceId
  await setDoc(doc(db, 'users', user.uid), {
    username: cleanUsername,
    email: cleanEmail,
    created_at: new Date().toISOString(),
    role: 'user',
    image: "",
    deviceId: "", // Pole inicjalizowane jako puste
  });

  return user;
};

/**
 * Aktualizuje pole deviceId dla aktualnie zalogowanego użytkownika
 */
export const updateUserDeviceId = async (deviceId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('USER_NOT_LOGGED_IN');

  try {
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      deviceId: deviceId.trim()
    });
    console.log('Successfully updated deviceId to:', deviceId);
  } catch (error) {
    console.error('Error updating deviceId:', error);
    throw error;
  }
};

/**
 * Aktualizuje profil użytkownika (opcjonalnie hasło i/lub plik zdjęcia z galerii urządzenia)
 * @param newPassword Nowe hasło (jeśli ma zostać zmienione)
 * @param imageFile Obiekt pliku przekazany z ImagePickera (zawiera uri, type, name itd.)
 */
export const updateUserProfile = async (newPassword?: string, imageFile?: any): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('USER_NOT_LOGGED_IN');

  // 1. Aktualizacja hasła w Firebase Auth (jeśli podano nowe hasło)
  if (newPassword && newPassword.trim() !== '') {
    if (newPassword.length < 6) {
      throw new Error('PASSWORD_TOO_SHORT');
    }
    await updatePassword(user, newPassword);
  }

  // 2. Obsługa przesyłania zdjęcia do Supabase Storage (bucket: user_photos)
  if (imageFile && imageFile.uri) {
    try {
      const fileExt = imageFile.name ? imageFile.name.split('.').pop() : 'jpg';
      const uniqueFileName = `${user.uid}-${Date.now()}.${fileExt}`;
      const filePath = `users-photos/${uniqueFileName}`;

      let fileBody;

      // Identyczna logika podziału na Web (blob) oraz telefon / emulator (FormData)
      if (imageFile.uri.startsWith('blob:') || imageFile.uri.startsWith('http')) {
        const response = await fetch(imageFile.uri);
        fileBody = await response.arrayBuffer();
      } else {
        const formData = new FormData();
        formData.append('file', {
          uri: imageFile.uri,
          name: uniqueFileName,
          type: imageFile.type || 'image/jpeg',
        } as any);
        fileBody = formData;
      }

      // WYSYŁKA DO BUCKETU user_photos
      const { error: uploadError } = await supabase.storage
        .from('user_photos') // Twój docelowy bucket dla zdjęć użytkowników
        .upload(filePath, fileBody, {
          contentType: imageFile.type || 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Błąd uploadu Supabase Storage: ${uploadError.message}`);
      }

      // Pobieranie wygenerowanego, publicznego adresu URL z Supabase
      const { data } = supabase.storage
        .from('user_photos')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Aktualizacja pola "image" w dokumencie użytkownika w Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        image: publicUrl
      });

      console.log('Successfully updated profile image with Supabase URL:', publicUrl);
    } catch (storageError) {
      console.error('Błąd podczas przetwarzania lub wysyłania zdjęcia:', storageError);
      throw storageError;
    }
  }
};

/**
 * Usuwa konto użytkownika z Firebase Auth oraz jego profil z Firestore
 */
export const deleteUserAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('USER_NOT_LOGGED_IN');

  const userUid = user.uid;

  // 1. Najpierw usuwamy profil z bazy danych Firestore
  const userDocRef = doc(db, 'users', userUid);
  await deleteDoc(userDocRef);

  // 2. Następnie usuwamy konto z Firebase Authentication
  await deleteUser(user);
  console.log(`Successfully deleted user account: ${userUid}`);
};

export type AppThemeMode = 'light' | 'dark' | 'system';

// Funkcja zapisująca wybór motywu do profilu użytkownika w bazie
export const saveUserThemePreference = async (theme: AppThemeMode) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    // Zapisujemy/aktualizujemy pole themePreference w dokumencie użytkownika
    await setDoc(userRef, { themePreference: theme }, { merge: true });
    console.log('Theme preference saved to DB:', theme);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
};

// Funkcja pobierająca motyw z bazy danych przy uruchomieniu aplikacji
export const getUserThemePreference = async (): Promise<AppThemeMode> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return 'system'; // Domyślnie systemowy, jeśli niezalogowany

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().themePreference) {
      return userSnap.data().themePreference as AppThemeMode;
    }
  } catch (error) {
    console.error('Error fetching theme preference:', error);
  }
  return 'system'; // Zwróć domyślny, jeśli brak wpisu w bazie
};

// Definicja typu zwracanego przez funkcję
export interface AssignedUser {
  uid: string;
  username: string;
  email: string;
  image?: string;
  role: string;
  created_at: string;
  deviceId: string;
}

/**
 * Pobiera listę użytkowników przypisanych do konkretnego ID karmnika (deviceId)
 * @param deviceId Unikalny identyfikator karmnika
 */
export const getUsersByDevice = async (deviceId: string): Promise<AssignedUser[]> => {
  const cleanDeviceId = deviceId.trim();

  if (!cleanDeviceId) {
    throw new Error('DEVICE_ID_CANNOT_BE_EMPTY');
  }

  try {
    const usersRef = collection(db, 'users');
    // Tworzymy zapytanie filtrujące po polu deviceId
    const q = query(usersRef, where('deviceId', '==', cleanDeviceId));
    const querySnapshot = await getDocs(q);

    const assignedUsers: AssignedUser[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      assignedUsers.push({
        uid: docSnap.id, // Identyfikator dokumentu (uid z Firebase Auth)
        username: data.username || '',
        email: data.email || '',
        image: data.image || '',
        role: data.role || 'user',
        created_at: data.created_at || '',
        deviceId: data.deviceId || '',
      });
    });

    console.log(`Successfully fetched ${assignedUsers.length} users for device: ${cleanDeviceId}`);
    return assignedUsers;
  } catch (error) {
    console.error('Error fetching users by deviceId:', error);
    throw error;
  }
};
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

  // 3. Zapis dokumentu w bazie Firestore
  await setDoc(doc(db, 'users', user.uid), {
    username: cleanUsername,
    email: cleanEmail,
    created_at: new Date().toISOString(),
    role: 'user',
    image: "",
  });

  return user;
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
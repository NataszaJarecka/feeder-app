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

const SUPABASE_URL = 'https://skprsjpylwpktvczmrkl.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'sb_publishable_Vcp4dKaoMGZXteoWbY-q2A_FMg9sTcy';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return userCredential.user;
};


export const registerNewUser = async (email: string, password: string, username: string) => {
  const cleanUsername = username.trim();
  const cleanEmail = email.trim();

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', cleanUsername));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    throw new Error('USERNAME_TAKEN');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    username: cleanUsername,
    email: cleanEmail,
    created_at: new Date().toISOString(),
    role: 'user',
    image: "",
    deviceId: "",
  });

  return user;
};


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


export const updateUserProfile = async (newPassword?: string, imageFile?: any): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('USER_NOT_LOGGED_IN');

  if (newPassword && newPassword.trim() !== '') {
    if (newPassword.length < 6) {
      throw new Error('PASSWORD_TOO_SHORT');
    }
    await updatePassword(user, newPassword);
  }

  if (imageFile && imageFile.uri) {
    try {
      const fileExt = imageFile.name ? imageFile.name.split('.').pop() : 'jpg';
      const uniqueFileName = `${user.uid}-${Date.now()}.${fileExt}`;
      const filePath = `users-photos/${uniqueFileName}`;

      let fileBody;

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

      const { error: uploadError } = await supabase.storage
        .from('user_photos')
        .upload(filePath, fileBody, {
          contentType: imageFile.type || 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Błąd uploadu Supabase Storage: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('user_photos')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

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


export const deleteUserAccount = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('USER_NOT_LOGGED_IN');

  const userUid = user.uid;

  const userDocRef = doc(db, 'users', userUid);
  await deleteDoc(userDocRef);

  await deleteUser(user);
  console.log(`Successfully deleted user account: ${userUid}`);
};

export type AppThemeMode = 'light' | 'dark' | 'system';

export const saveUserThemePreference = async (theme: AppThemeMode) => {
  const userId = auth.currentUser?.uid;
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { themePreference: theme }, { merge: true });
    console.log('Theme preference saved to DB:', theme);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
};

export const getUserThemePreference = async (): Promise<AppThemeMode> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return 'system';
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists() && userSnap.data().themePreference) {
      return userSnap.data().themePreference as AppThemeMode;
    }
  } catch (error) {
    console.error('Error fetching theme preference:', error);
  }
  return 'system';
};

export interface AssignedUser {
  uid: string;
  username: string;
  email: string;
  image?: string;
  role: string;
  created_at: string;
  deviceId: string;
}


export const getUsersByDevice = async (deviceId: string): Promise<AssignedUser[]> => {
  const cleanDeviceId = deviceId.trim();

  if (!cleanDeviceId) {
    throw new Error('DEVICE_ID_CANNOT_BE_EMPTY');
  }

  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('deviceId', '==', cleanDeviceId));
    const querySnapshot = await getDocs(q);

    const assignedUsers: AssignedUser[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      assignedUsers.push({
        uid: docSnap.id,
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
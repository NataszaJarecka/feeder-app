import { collection, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export interface DBNotification {
  id: string;
  createdAt: number;
  deviceId: string;
  cleared: boolean;
  petId: string;
  type: 'FEEDING_SUCCESS' | 'FEEDING_FAIL' | 'FEEDING_ERROR';
}

export interface DisplayNotification {
  id: string;
  time: string;
  type: 'pet' | 'alert';
  name?: string;
  msg: string;
  subMsg?: string;
  petId?: string;
  avatarUrl?: string;
}


export const fetchUserNotifications = async (): Promise<DisplayNotification[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return [];

    const userData = userSnap.data();
    const userDeviceId = userData.deviceId;

    if (!userDeviceId || userDeviceId.trim() === '') {
      console.log('Użytkownik nie ma przypisanego karmnika.');
      return [];
    }

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('deviceId', '==', userDeviceId),
      where('cleared', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const rawNotifications: DBNotification[] = [];

    querySnapshot.forEach((docSnap) => {
      rawNotifications.push({ id: docSnap.id, ...docSnap.data() } as DBNotification);
    });

    const displayNotifications: DisplayNotification[] = [];

    const petCache: Record<string, { name: string; image: string }> = {};

    for (const notif of rawNotifications) {
      let petName = 'Pet';
      let petImage = '';

      if (notif.petId) {
        if (petCache[notif.petId]) {
          petName = petCache[notif.petId].name;
          petImage = petCache[notif.petId].image;
        } else {
          try {
            const petDocRef = doc(db, 'pets', notif.petId);
            const petSnap = await getDoc(petDocRef);
            if (petSnap.exists()) {
              const petData = petSnap.data();
              petName = petData.name || 'Pet';
              petImage = petData.image || '';

              petCache[notif.petId] = { name: petName, image: petImage };
            }
          } catch (e) {
            console.warn(`Nie udało się pobrać danych zwierzaka o ID: ${notif.petId}`, e);
          }
        }
      }

      const dateObj = new Date(notif.createdAt * 1000);

      const timeStr = dateObj.toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateStr = dateObj.toLocaleDateString('pl', { day: 'numeric', month: 'short' });
      const fullTime = `${dateStr}, ${timeStr}`;

      if (notif.type === 'FEEDING_SUCCESS') {
        displayNotifications.push({
          id: notif.id,
          time: fullTime,
          type: 'pet',
          name: petName,
          msg: 'zjadł(a) posiłek.',
          petId: notif.petId,
          avatarUrl: petImage
        });
      } else if (notif.type === 'FEEDING_FAIL') {
        displayNotifications.push({
          id: notif.id,
          time: fullTime,
          type: 'pet',
          name: petName,
          msg: "nie skończył(a) posiłku!",
          petId: notif.petId,
          avatarUrl: petImage
        });
      } else if (notif.type === 'FEEDING_ERROR') {
        displayNotifications.push({
          id: notif.id,
          time: fullTime,
          type: 'alert',
          msg: 'Nie udało się podać posiłku!',
          subMsg: 'Coś się zacięło. Sprawdź podajnik na karmę.'
        });
      }
    }

    return displayNotifications;
  } catch (error) {
    console.error('Błąd pobierania powiadomień:', error);
    throw error;
  }
};


export const clearAllUserNotifications = async (notificationIds: string[]): Promise<void> => {
  if (notificationIds.length === 0) return;

  try {
    const batch = writeBatch(db);

    notificationIds.forEach((id) => {
      const docRef = doc(db, 'notifications', id);
      batch.update(docRef, { cleared: true });
    });

    await batch.commit();
    console.log(`Pomyślnie oznaczono jako cleared ${notificationIds.length} powiadomień w bazie.`);
  } catch (error) {
    console.error('Błąd podczas czyszczenia powiadomień w bazie:', error);
    throw error;
  }
};


export const registerForPushNotificationsAsync = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.log(" 📱 [Push] Brak zalogowanego użytkownika. Przerywam.");
    return;
  }

  if (Platform.OS === 'web') {
    console.log(' [Push] Wykryto platformę Web. Powiadomienia push wyłączone w przeglądarce.');
    return;
  }

  if (!Device.isDevice) {
    console.log(' [Push] Funkcja odpalona na emulatorze. Tokeny push zapisują się TYLKO na fizycznych urządzeniach.');
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log(' [Push] Użytkownik nie wyraził zgody na powiadomienia.');
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    console.log(" [Push] Wygenerowano token urządzenia:", token);

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      pushToken: token
    });

    console.log(' [Push] Token został zapisany w Firestore dla UID:', user.uid);

  } catch (error) {
    console.error('[Push] Coś poszło nie tak przy generowaniu lub zapisie tokenu:', error);
  }
};
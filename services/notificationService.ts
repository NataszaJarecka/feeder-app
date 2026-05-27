import { collection, doc, getDoc, getDocs, limit, orderBy, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../firebaseConfig';

// IMPORTY DLA POWIADOMIEŃ PUSH
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

export interface DBNotification {
  id: string;
  createdAt: number; // Czas Unix w sekundach (10 cyfr)
  deviceId: string;
  cleared: boolean;
  petId: string;
  type: 'FEEDING_SUCCESS' | 'FEEDING_FAIL' | 'DEVICE_ERROR';
}

export interface DisplayNotification {
  id: string;
  time: string;
  type: 'pet' | 'alert';
  name?: string;
  msg: string;
  subMsg?: string;
  petId?: string;
}

/**
 * Pobiera powiadomienia dla aktualnie zalogowanego użytkownika, które NIE zostały wyczyszczone (cleared == false)
 */
export const fetchUserNotifications = async (): Promise<DisplayNotification[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    // 1. Pobierz profil użytkownika, aby poznać jego deviceId
    const userDocRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) return [];

    const userData = userSnap.data();
    const userDeviceId = userData.deviceId;

    if (!userDeviceId || userDeviceId.trim() === '') {
      console.log('Użytkownik nie ma przypisanego karmnika.');
      return [];
    }

    // 2. Pobierz powiadomienia dopasowane do deviceId, gdzie cleared == false
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

    // 3. Przetwórz powiadomienia i pobierz imiona zwierząt
    const displayNotifications: DisplayNotification[] = [];

    for (const notif of rawNotifications) {
      let petName = 'Pet';

      if (notif.petId) {
        try {
          const petDocRef = doc(db, 'pets', notif.petId);
          const petSnap = await getDoc(petDocRef);
          if (petSnap.exists()) {
            petName = petSnap.data().name || 'Pet';
          }
        } catch (e) {
          console.warn(`Nie udało się pobrać imienia zwierzaka o ID: ${notif.petId}`, e);
        }
      }

      // Konwersja czasu z sekund na milisekund dla JavaScriptu
      const dateObj = new Date(notif.createdAt * 1000);

      // Wymuszenie języka angielskiego ('en-US') i formatu 24-godzinnego
      const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const fullTime = `${dateStr}, ${timeStr}`; // Wynik: np. "May 27, 21:28"

      if (notif.type === 'FEEDING_SUCCESS') {
        displayNotifications.push({
          id: notif.id,
          time: fullTime,
          type: 'pet',
          name: petName,
          msg: 'has finished a meal.',
          petId: notif.petId
        });
      } else if (notif.type === 'FEEDING_FAIL') {
        displayNotifications.push({
          id: notif.id,
          time: fullTime,
          type: 'pet',
          name: petName,
          msg: "hasn't finished a meal!",
          petId: notif.petId
        });
      } else if (notif.type === 'DEVICE_ERROR') {
        displayNotifications.push({
          id: notif.id,
          time: fullTime,
          type: 'alert',
          msg: 'Failed to serve a meal!',
          subMsg: 'Something is jammed. Please check the feeder.'
        });
      }
    }

    return displayNotifications;
  } catch (error) {
    console.error('Błąd pobierania powiadomień:', error);
    throw error;
  }
};

/**
 * Zmienia wartość pola 'cleared' na true w bazie danych dla podanych ID powiadomień (Batch update)
 */
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

/**
 * Generuje unikalny token push dla telefonu i zapisuje go w profilu użytkownika
 */
export const registerForPushNotificationsAsync = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    console.log(" 📱 [Push] Brak zalogowanego użytkownika. Przerywam.");
    return;
  }

  // Blokada dla przeglądarek internetowych, aby zapobiec błędowi klucza VAPID
  if (Platform.OS === 'web') {
    console.log(' 🌐 [Push] Wykryto platformę Web. Powiadomienia push wyłączone w przeglądarce.');
    return;
  }

  // Zabezpieczenie dla emulatorów komputerowych (Push wymaga fizycznego telefonu)
  if (!Device.isDevice) {
    console.log(' 📱 [Push] Funkcja odpalona na emulatorze. Tokeny push zapisują się TYLKO na fizycznych urządzeniach.');
    return;
  }

  try {
    // 1. Prośba o uprawnienia systemowe
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log(' ❌ [Push] Użytkownik nie wyraził zgody na powiadomienia.');
      return;
    }

    // 2. Pobranie unikalnego tokenu z serwerów Expo
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    console.log(" 🎉 [Push] Wygenerowano token urządzenia:", token);

    // 3. Zapis pola pushToken bezpośrednio w dokumencie zalogowanego użytkownika
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      pushToken: token
    });

    console.log(' ✅ [Push] Token został zapisany w Firestore dla UID:', user.uid);

  } catch (error) {
    console.error(' ❌ [Push] Coś poszło nie tak przy generowaniu lub zapisie tokenu:', error);
  }
};
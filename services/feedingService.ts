import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface Meal {
  id: string;
  petId: string;
  timestamp: any;
  timestampUnix: number;
  portionGrams: number;
  status: 'scheduled' | 'fed' | 'missed';
}

export type NewMeal = Omit<Meal, 'id' | 'timestampUnix'>;

const getUnixSeconds = (timestampField: any): number => {
  const dateObj = timestampField instanceof Timestamp
    ? timestampField.toDate()
    : new Date(timestampField);

  // <<< KLUCZOWA POPRAWKA: zerujemy sekundy i milisekundy
  dateObj.setSeconds(0, 0);

  return Math.floor(dateObj.getTime() / 1000);
};

/**
 * FUNKCJA POMOCNICZA: Szuka najbliższego zaplanowanego karmienia w bazie
 * i zapisuje je do stałego dokumentu "nextFeeding/feeder_id"
 */
const updateNextFeedingDoc = async (): Promise<void> => {
  try {
    const mealsCollection = collection(db, 'feedings');
    const nowUnix = Math.floor(Date.now() / 1000);

    // Szukamy posiłków o statusie 'scheduled', których czas jest w przyszłości (lub teraz)
    const q = query(
      mealsCollection,
      where('status', '==', 'scheduled'),
      where('timestampUnix', '>=', nowUnix),
      orderBy('timestampUnix', 'asc')
    );

    const querySnapshot = await getDocs(q);

    // Stała referencja do dokumentu, z którego będzie czytać ESP32
    // Możesz użyć stałego ID urządzenia, np. 'device_01'
    const nextFeedingRef = doc(db, 'nextFeeding', 'device_01');

    if (!querySnapshot.empty) {
      // Pierwszy dokument z posortowanych rosnąco to najbliższe karmienie
      const firstMealDoc = querySnapshot.docs[0];
      const mealData = firstMealDoc.data();

      // Zapisujemy (lub nadpisujemy) stały dokument uproszczonymi danymi
      await setDoc(nextFeedingRef, {
        mealId: firstMealDoc.id,
        petId: mealData.petId,
        timestampUnix: mealData.timestampUnix,
        portionGrams: mealData.portionGrams,
        hasActiveTask: true // Flaga pomocnicza dla mikrokontrolera
      });
    } else {
      // Jeśli nie ma żadnych zaplanowanych karmień na przyszłość, czyścimy dokument
      await setDoc(nextFeedingRef, {
        hasActiveTask: false
      });
    }
  } catch (error) {
    console.error("Błąd podczas aktualizacji najbliższego karmienia:", error);
  }
};

// --- MODYFIKACJA GŁÓWNYCH FUNKCJI (Dodane wywołanie updateNextFeedingDoc) ---

export const addMeal = async (mealData: NewMeal): Promise<Meal> => {
  try {
    const mealsCollection = collection(db, 'feedings');
    const fullMealData = {
      ...mealData,
      timestampUnix: getUnixSeconds(mealData.timestamp)
    };

    const docRef = await addDoc(mealsCollection, fullMealData);

    // Po dodaniu posiłku aktualizujemy informację o najbliższym karmieniu
    await updateNextFeedingDoc();

    return { id: docRef.id, ...fullMealData };
  } catch (error) {
    console.error("Błąd podczas dodawania posiłku:", error);
    throw error;
  }
};

export const updateMeal = async (mealId: string, updatedData: Partial<Meal>): Promise<void> => {
  try {
    const mealDocRef = doc(db, 'feedings', mealId);
    const dataToUpdate = { ...updatedData };

    if (updatedData.timestamp) {
      dataToUpdate.timestampUnix = getUnixSeconds(updatedData.timestamp);
    }

    await updateDoc(mealDocRef, dataToUpdate);

    // Po edycji posiłku (np. zmianie godziny lub statusu na 'fed') aktualizujemy dokument dla ESP32
    await updateNextFeedingDoc();
  } catch (error) {
    console.error("Błąd podczas aktualizacji posiłku:", error);
    throw error;
  }
};

export const deleteMeal = async (mealId: string): Promise<void> => {
  try {
    const mealDocRef = doc(db, 'feedings', mealId);
    await deleteDoc(mealDocRef);

    // Po usunięciu posiłku również sprawdzamy, co teraz jest najbliższe
    await updateNextFeedingDoc();
  } catch (error) {
    console.error("Błąd podczas usuwania posiłku:", error);
    throw error;
  }
};

export const getAllMealsByDate = async (date: Date): Promise<Meal[]> => {
  try {
    const mealsCollection = collection(db, 'feedings');
    const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      mealsCollection,
      where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
      where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const mealsList: Meal[] = [];
    querySnapshot.forEach((doc) => {
      mealsList.push({ id: doc.id, ...(doc.data() as Omit<Meal, 'id'>) });
    });
    return mealsList;
  } catch (error) {
    console.error("Błąd pobierania posiłków:", error);
    throw error;
  }
};
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type RecurrenceType = 'ONCE' | 'DAILY' | 'WEEKLY';

export interface Meal {
  id: string;
  petId: string;
  timestamp: any;
  timestampUnix: number;
  portionGrams: number;
  status: 'scheduled' | 'fed' | 'missed';
  // NOWE POLA DLA POWTARZALNOŚCI:
  recurrence?: RecurrenceType;
  endDate?: number;   // Unix timestamp (sekundy) określający koniec serii
  groupId?: string;   // Identyfikator łączący powtarzające się posiłki w jedną serię
}

// Rozszerzamy NewMeal o parametry powtarzalności z widoku
export type NewMeal = Omit<Meal, 'id' | 'timestampUnix'>;

const getUnixSeconds = (timestampField: any): number => {
  const dateObj = timestampField instanceof Timestamp
    ? timestampField.toDate()
    : new Date(timestampField);

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

    const q = query(
      mealsCollection,
      where('status', '==', 'scheduled'),
      where('timestampUnix', '>=', nowUnix),
      orderBy('timestampUnix', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const nextFeedingRef = doc(db, 'nextFeeding', 'device_01');

    if (!querySnapshot.empty) {
      const firstMealDoc = querySnapshot.docs[0];
      const mealData = firstMealDoc.data();

      await setDoc(nextFeedingRef, {
        mealId: firstMealDoc.id,
        petId: mealData.petId,
        timestampUnix: mealData.timestampUnix,
        portionGrams: mealData.portionGrams,
        hasActiveTask: true
      });
    } else {
      await setDoc(nextFeedingRef, {
        hasActiveTask: false
      });
    }
  } catch (error) {
    console.error("Błąd podczas aktualizacji najbliższego karmienia:", error);
  }
};

/**
 * ZMODYFIKOWANA FUNKCJA: Dodaje pojedynczy posiłek lub generuje serię posiłków w pętli
 */
export const addMeal = async (mealData: NewMeal): Promise<Meal> => {
  try {
    const mealsCollection = collection(db, 'feedings');

    // Jeśli posiłek jest jednorazowy, wykonujemy standardowy, pojedynczy zapis
    if (!mealData.recurrence || mealData.recurrence === 'ONCE') {
      const fullMealData = {
        ...mealData,
        recurrence: 'ONCE' as RecurrenceType,
        timestampUnix: getUnixSeconds(mealData.timestamp)
      };
      const docRef = await addDoc(mealsCollection, fullMealData);
      await updateNextFeedingDoc();
      return { id: docRef.id, ...fullMealData };
    }

    // JEŚLI RECURRENCE JEST 'DAILY' LUB 'WEEKLY':
    const batch = writeBatch(db);
    const groupId = `${Date.now()}_${mealData.petId}`; // Unikalne ID całej serii

    let currentMoment = mealData.timestamp instanceof Timestamp
      ? mealData.timestamp.toDate()
      : new Date(mealData.timestamp);

    const endLimitTimestamp = mealData.endDate ? mealData.endDate * 1000 : currentMoment.getTime();

    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    let loop = true;
    let firstCreatedMeal: Meal | null = null;

    while (loop) {
      const newDocRef = doc(mealsCollection);
      const unixSec = Math.floor(currentMoment.getTime() / 1000);

      const itemData = {
        ...mealData,
        groupId,
        timestamp: Timestamp.fromDate(new Date(currentMoment)),
        timestampUnix: unixSec
      };

      batch.set(newDocRef, itemData);

      // Zapisujemy referencję do pierwszego wygenerowanego elementu serii, aby go zwrócić z funkcji
      if (!firstCreatedMeal) {
        firstCreatedMeal = { id: newDocRef.id, ...itemData };
      }

      // Przesuwamy wskaźnik daty w pętli do przodu
      if (mealData.recurrence === 'DAILY') {
        currentMoment = new Date(currentMoment.getTime() + ONE_DAY_MS);
      } else if (mealData.recurrence === 'WEEKLY') {
        currentMoment = new Date(currentMoment.getTime() + ONE_WEEK_MS);
      }

      // Przerywamy pętlę, jeśli przekroczymy datę graniczną
      if (currentMoment.getTime() > endLimitTimestamp) {
        loop = false;
      }
    }

    // Zapis zbiorczy wszystkich wygenerowanych powtórzeń za jednym zamachem
    await batch.commit();
    await updateNextFeedingDoc();

    return firstCreatedMeal || { id: '', ...mealData, timestampUnix: getUnixSeconds(mealData.timestamp) };
  } catch (error) {
    console.error("Błąd podczas dodawania posiłku (recurrence):", error);
    throw error;
  }
};

/**
 * ZMODYFIKOWANA FUNKCJA: Aktualizuje pojedynczy posiłek, lub opcjonalnie całą serię w przód
 */
export const updateMeal = async (mealId: string, updatedData: Partial<Meal>, updateSeries: boolean = false): Promise<void> => {
  try {
    const mealDocRef = doc(db, 'feedings', mealId);
    const dataToUpdate = { ...updatedData };

    if (updatedData.timestamp) {
      dataToUpdate.timestampUnix = getUnixSeconds(updatedData.timestamp);
    }

    // Jeśli nie aktualizujemy serii lub posiłek nie należy do żadnej serii (brak groupId)
    if (!updateSeries || !updatedData.groupId) {
      await updateDoc(mealDocRef, dataToUpdate);
    } else {
      // Aktualizacja całej serii (zmieniamy parametry dla wszystkich przyszłych posiłków z tym samym groupId)
      const mealsCollection = collection(db, 'feedings');
      const q = query(
        mealsCollection,
        where('groupId', '==', updatedData.groupId),
        where('status', '==', 'scheduled') // Zmieniamy tylko te, które jeszcze się nie odbyły
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((docSnap) => {
        const docRef = doc(db, 'feedings', docSnap.id);

        // Jeżeli zmieniono godzinę posiłku, musimy zachować oryginalny DZIEŃ dla każdego powtórzenia serii!
        if (updatedData.timestamp && docSnap.id !== mealId) {
          const currentDocDate = docSnap.data().timestamp.toDate();
          const newTimeDate = updatedData.timestamp instanceof Timestamp ? updatedData.timestamp.toDate() : new Date(updatedData.timestamp);

          currentDocDate.setHours(newTimeDate.getHours(), newTimeDate.getMinutes(), 0, 0);

          batch.update(docRef, {
            ...dataToUpdate,
            timestamp: Timestamp.fromDate(currentDocDate),
            timestampUnix: Math.floor(currentDocDate.getTime() / 1000)
          });
        } else {
          batch.update(docRef, dataToUpdate);
        }
      });

      await batch.commit();
    }

    await updateNextFeedingDoc();
  } catch (error) {
    console.error("Błąd podczas aktualizacji posiłku:", error);
    throw error;
  }
};

/**
 * ZMODYFIKOWANA FUNKCJA: Usuwa posiłek, lub opcjonalnie wszystkie powtórzenia danej serii w bazie
 */
export const deleteMeal = async (mealId: string, deleteSeries: boolean = false, groupId?: string): Promise<void> => {
  try {
    if (!deleteSeries || !groupId) {
      // Tradycyjne usunięcie jednego kafelka
      const mealDocRef = doc(db, 'feedings', mealId);
      await deleteDoc(mealDocRef);
    } else {
      // Usuwanie całej serii powiązanego ze sobą harmonogramu za pomocą writeBatch
      const mealsCollection = collection(db, 'feedings');
      const q = query(mealsCollection, where('groupId', '==', groupId));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        const docRef = doc(db, 'feedings', docSnap.id);
        batch.delete(docRef);
      });

      await batch.commit();
    }

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
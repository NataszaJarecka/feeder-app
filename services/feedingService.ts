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
  recurrence?: RecurrenceType;
  endDate?: number;
  groupId?: string;
}

export type NewMeal = Omit<Meal, 'id' | 'timestampUnix'>;

const getUnixSeconds = (timestampField: any): number => {
  const dateObj = timestampField instanceof Timestamp
    ? timestampField.toDate()
    : new Date(timestampField);

  dateObj.setSeconds(0, 0);
  return Math.floor(dateObj.getTime() / 1000);
};


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


export const addMeal = async (mealData: NewMeal): Promise<Meal> => {
  try {
    const mealsCollection = collection(db, 'feedings');

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

    const batch = writeBatch(db);
    const groupId = `${Date.now()}_${mealData.petId}`;

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

      if (!firstCreatedMeal) {
        firstCreatedMeal = { id: newDocRef.id, ...itemData };
      }

      if (mealData.recurrence === 'DAILY') {
        currentMoment = new Date(currentMoment.getTime() + ONE_DAY_MS);
      } else if (mealData.recurrence === 'WEEKLY') {
        currentMoment = new Date(currentMoment.getTime() + ONE_WEEK_MS);
      }

      if (currentMoment.getTime() > endLimitTimestamp) {
        loop = false;
      }
    }

    await batch.commit();
    await updateNextFeedingDoc();

    return firstCreatedMeal || { id: '', ...mealData, timestampUnix: getUnixSeconds(mealData.timestamp) };
  } catch (error) {
    console.error("Błąd podczas dodawania posiłku (recurrence):", error);
    throw error;
  }
};


export const updateMeal = async (mealId: string, updatedData: Partial<Meal>, updateSeries: boolean = false): Promise<void> => {
  try {
    const mealDocRef = doc(db, 'feedings', mealId);
    const dataToUpdate = { ...updatedData };

    if (updatedData.timestamp) {
      dataToUpdate.timestampUnix = getUnixSeconds(updatedData.timestamp);
    }

    if (!updateSeries || !updatedData.groupId) {
      await updateDoc(mealDocRef, dataToUpdate);
    } else {
      const mealsCollection = collection(db, 'feedings');
      const q = query(
        mealsCollection,
        where('groupId', '==', updatedData.groupId),
        where('status', '==', 'scheduled')
      );

      const querySnapshot = await getDocs(q);
      const batch = writeBatch(db);

      querySnapshot.forEach((docSnap) => {
        const docRef = doc(db, 'feedings', docSnap.id);

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


export const deleteMeal = async (mealId: string, deleteSeries: boolean = false, groupId?: string): Promise<void> => {
  try {
    if (!deleteSeries || !groupId) {
      const mealDocRef = doc(db, 'feedings', mealId);
      await deleteDoc(mealDocRef);
    } else {
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
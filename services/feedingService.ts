import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // popraw ścieżkę do swojej konfiguracji Firebase

// 1. Definiujemy strukturę danych posiłku
export interface Meal {
  id: string;          // Unikalne ID posiłku generowane przez Firestore
  petId: string;       // ID zwierzaka, do którego należy posiłek
  timestamp: any;      // Znacznik czasu z Firebase (Timestamp)
  portionGrams: number;// Wielkość porcji w gramach
  status: 'scheduled' | 'fed' | 'missed'; // Status karmienia
}

// Typ do tworzenia nowego posiłku (bez pola id)
export type NewMeal = Omit<Meal, 'id'>;


/**
 * Zapisuje nowy posiłek do bazy danych Firestore.
 * @param mealData Obiekt klasy NewMeal zawierający petId, timestamp, portionGrams oraz status.
 */
export const addMeal = async (mealData: NewMeal): Promise<Meal> => {
  try {
    // Upewnij się, że nazwa kolekcji jest spójna z funkcją pobierającą ('feedings')
    const mealsCollection = collection(db, 'feedings');
    const docRef = await addDoc(mealsCollection, mealData);

    return {
      id: docRef.id,
      ...mealData
    };
  } catch (error) {
    console.error("Błąd podczas dodawania posiłku:", error);
    throw error;
  }
};


/**
 * Pobiera posiłki WSZYSTKICH zwierzaków z konkretnego dnia posortowane chronologicznie.
 * @param date Obiekt typu Date reprezentujący dzień, który nas interesuje
 */
export const getAllMealsByDate = async (date: Date): Promise<Meal[]> => {
  try {
    const mealsCollection = collection(db, 'feedings');

    // 1. Generujemy początek wybranego dnia (00:00:00.000) w czasie lokalnym
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // 2. Generujemy koniec wybranego dnia (23:59:59.999) w czasie lokalnym
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 3. Konwertujemy daty JavaScript na obiekty Timestamp akceptowane przez Firestore
    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    // 4. Budujemy zapytanie:
    // - filtrujemy dokumenty mieszczące się w wybranym dniu
    // - sortujemy je rosnąco ('asc') po znaczniku czasu, czyli od najwcześniejszego do najpóźniejszego
    const q = query(
      mealsCollection,
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const mealsList: Meal[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      mealsList.push({
        id: doc.id,
        ...(data as Omit<Meal, 'id'>)
      });
    });

    return mealsList;
  } catch (error) {
    console.error("Błąd pobierania i sortowania posiłków:", error);
    throw error;
  }
};

export const updateMeal = async (mealId: string, updatedData: Partial<Meal>): Promise<void> => {
  const mealDocRef = doc(db, 'feedings', mealId);
  await updateDoc(mealDocRef, updatedData);
};

export const deleteMeal = async (mealId: string): Promise<void> => {
  const mealDocRef = doc(db, 'feedings', mealId);
  await deleteDoc(mealDocRef);
};
import { collection, getCountFromServer, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface PetStatistic {
  id: string;
  petId: string;
  date: any;
  eatingSpeed: number;
  mealsEaten: number;
  mealsMissed: number;
}

// Istniejąca funkcja pobierania statystyk po dacie
export const getStatisticsByDate = async (date: Date): Promise<PetStatistic[]> => {
  try {
    const statsCollection = collection(db, 'statistics');

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfDay);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    const q = query(
      statsCollection,
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp)
    );

    const querySnapshot = await getDocs(q);
    const statisticsList: PetStatistic[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      statisticsList.push({
        id: doc.id,
        ...(data as Omit<PetStatistic, 'id'>)
      });
    });

    return statisticsList;
  } catch (error) {
    console.error("Błąd pobierania statystyk:", error);
    throw error;
  }
};

/**
 * Funkcja zliczająca ile razy dany pies był karmiony.
 * @param petId Identyfikator psa, którego karmienia chcemy policzyć.
 * @returns Liczba karmień (number).
 */
export const getFeedingCountForPet = async (petId: string): Promise<number> => {
  try {
    // Zakładam, że kolekcja nazywa się 'feedings', a pole przechowujące ID psa to 'petId'.
    // Jeśli w bazie masz np. 'feeding' lub pole nazywa się 'dogId', dostosuj poniższe nazwy.
    const feedingsCollection = collection(db, 'feedings');

    const q = query(feedingsCollection, where('petId', '==', petId));

    // getCountFromServer pobiera tylko liczbę dokumentów (jest szybsze i tańsze)
    const snapshot = await getCountFromServer(q);

    return snapshot.data().count;
  } catch (error) {
    console.error(`Błąd podczas zliczania karmień dla psa o ID ${petId}:`, error);
    throw error;
  }
};
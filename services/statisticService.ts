import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // popraw ścieżkę do swojej konfiguracji Firebase

// 1. Definiujemy strukturę danych statystyk na podstawie Firestore
export interface PetStatistic {
  id: string;          // Unikalne ID dokumentu generowane przez Firestore
  petId: string;       // ID zwierzaka, do którego należą statystyki (np. "Hans")
  date: any;           // Znacznik czasu z Firebase (Timestamp)
  eatingSpeed: number; // Prędkość jedzenia
  mealsEaten: number;  // Zjedzone posiłki
  mealsMissed: number; // Opuszczone posiłki
}

/**
 * Pobiera statystyki WSZYSTKICH zwierzaków z konkretnego dnia.
 * Godzina zapisu w bazie nie ma znaczenia – liczy się tylko dzień.
 * * @param date Obiekt typu Date reprezentujący dzień, który nas interesuje
 */
export const getStatisticsByDate = async (date: Date): Promise<PetStatistic[]> => {
  try {
    const statsCollection = collection(db, 'statistics'); // upewnij się, że nazwa kolekcji jest poprawna!

    // Generujemy początek dnia w UTC
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    // Generujemy koniec dnia w UTC
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


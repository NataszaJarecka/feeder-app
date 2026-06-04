import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface PetStatistic {
  id: string;
  petId: string;
  date: any;
  eatingSpeed: number;
  mealsEaten: number;
  mealsMissed: number;
}


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


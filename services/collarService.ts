import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// 1. Definicja interfejsu dokładnie według Twojej bazy danych
export interface Collar {
  id: string;
  colour: string;
  tagId: string;
}

export type NewCollar = Omit<Collar, 'id'>;

// 2. Pobranie wszystkich obroży
export const getAllCollars = async (): Promise<Collar[]> => {
  try {
    const collarsCollection = collection(db, 'collars');
    // Sortujemy domyślnie po kolorze, żeby zachować spójność z orderBy z Twojego wzoru
    const q = query(collarsCollection, orderBy('colour', 'asc'));

    const querySnapshot = await getDocs(q);
    const collarsList: Collar[] = [];

    querySnapshot.forEach((docSnap) => {
      collarsList.push({ id: docSnap.id, ...(docSnap.data() as Omit<Collar, 'id'>) });
    });

    return collarsList;
  } catch (error) {
    console.error("Błąd podczas pobierania wszystkich obroży:", error);
    throw error;
  }
};

// 3. Pobranie pojedynczej obroży po ID dokumentu
export const getCollarById = async (collarId: string): Promise<Collar | null> => {
  try {
    const collarDocRef = doc(db, 'collars', collarId);
    const docSnap = await getDoc(collarDocRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<Collar, 'id'>) };
    }

    return null;
  } catch (error) {
    console.error(`Błąd podczas pobierania obroży o ID ${collarId}:`, error);
    throw error;
  }
};

// 4. Dodanie nowej obroży (np. z formularza w aplikacji)
export const addCollar = async (collarData: NewCollar): Promise<Collar> => {
  try {
    const collarsCollection = collection(db, 'collars');
    const docRef = await addDoc(collarsCollection, collarData);

    return { id: docRef.id, ...collarData };
  } catch (error) {
    console.error("Błąd podczas dodawania nowej obroży:", error);
    throw error;
  }
};

// 5. Aktualizacja pól obroży (np. zmiana tagId lub koloru)
export const updateCollar = async (collarId: string, updatedData: Partial<Collar>): Promise<void> => {
  try {
    const collarDocRef = doc(db, 'collars', collarId);
    await updateDoc(collarDocRef, updatedData);
  } catch (error) {
    console.error(`Błąd podczas aktualizacji obroży o ID ${collarId}:`, error);
    throw error;
  }
};

// 6. Usunięcie obroży
export const deleteCollar = async (collarId: string): Promise<void> => {
  try {
    const collarDocRef = doc(db, 'collars', collarId);
    await deleteDoc(collarDocRef);
  } catch (error) {
    console.error(`Błąd podczas usuwania obroży o ID ${collarId}:`, error);
    throw error;
  }
};

export const isCollarColourTaken = async (colour: string): Promise<boolean> => {
  try {
    const petsCollection = collection(db, 'pets');

    // Tworzymy zapytanie szukające zwierzaka z wybranym kolorem obroży
    const q = query(petsCollection, where('collar', '==', colour));

    const querySnapshot = await getDocs(q);

    // Jeśli snapshot nie jest pusty (!empty), to znaczy, że ktoś już ma ten kolor
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`Błąd podczas sprawdzania czy kolor obroży "${colour}" jest zajęty:`, error);
    throw error;
  }
};
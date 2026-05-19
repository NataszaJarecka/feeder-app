import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // popraw ścieżkę w zależności od tego, gdzie zapiszesz plik

// Definiujemy strukturę danych zwierzaka dla TypeScriptu
export interface Pet {
  id: string;
  name: string;
  collar: string;
  image: string;
  userId: string;
}

// Typ dla nowego zwierzaka, który nie ma jeszcze nadanego ID z bazy danych
export type NewPet = Omit<Pet, 'id'>;

// Funkcja pobierająca zwierzaki przypisane do danego userId
export const getPetsByUser = async (userId: string): Promise<Pet[]> => {
  try {
    const petsCollection = collection(db, 'pets');

    // Tworzymy zapytanie z filtrem: gdzie pole 'userId' jest równe przekazanemu userId
    const q = query(petsCollection, where('userId', '==', userId));

    const querySnapshot = await getDocs(q);
    const petsList: Pet[] = [];

    querySnapshot.forEach((doc) => {
      // Łączymy ID dokumentu z jego zawartością
      petsList.push({
        id: doc.id,
        ...(doc.data() as Omit<Pet, 'id'>)
      });
    });

    return petsList;
  } catch (error) {
    console.error("Błąd podczas pobierania zwierzaków: ", error);
    throw error;
  }
};

/**
 * Funkcja dodająca nowego zwierzaka do bazy danych Firestore.
 * @param petData Dane nowego zwierzaka (name, collarId, imageUrl, userId)
 * @returns Promise<Pet> Zwraca obiekt zwierzaka uzupełniony o wygenerowane id z bazy danych
 */
export const addPet = async (petData: NewPet): Promise<Pet> => {
  try {
    const petsCollection = collection(db, 'pets');

    // addDoc automatycznie tworzy nowy dokument z losowym ID w kolekcji 'pets'
    const docRef = await addDoc(petsCollection, petData);

    // Zwracamy obiekt w pełnym formacie interfejsu Pet (razem z nowym ID)
    return {
      id: docRef.id,
      ...petData
    };
  } catch (error) {
    console.error("Błąd podczas dodawania zwierzaka: ", error);
    throw error;
  }
};


export const getPetById = async (petId: string): Promise<Pet | null> => {
  try {
    const petDocRef = doc(db, 'pets', petId);
    const docSnap = await getDoc(petDocRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...(docSnap.data() as Omit<Pet, 'id'>)
      };
    } else {
      console.log("Nie znaleziono zwierzaka o podanym ID");
      return null;
    }
  } catch (error) {
    console.error("Błąd podczas pobierania zwierzaka po ID: ", error);
    throw error;
  }
};
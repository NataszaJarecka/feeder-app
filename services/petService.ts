import { createClient } from '@supabase/supabase-js';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // popraw ścieżkę w zależności od tego, gdzie zapiszesz plik

// 1. Inicjalizacja klienta Supabase
// Te dane znajdziesz w panelu Supabase w Settings -> API
const SUPABASE_URL = 'https://skprsjpylwpktvczmrkl.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'sb_publishable_Vcp4dKaoMGZXteoWbY-q2A_FMg9sTcy';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Definiujemy strukturę danych zwierzaka dla TypeScriptu
export interface Pet {
  id: string;
  name: string;
  collar: string;
  image: string; // Tutaj ostatecznie w Firestore wyląduje tekstowy URL ze zdjęciem
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
 * Zmodyfikowana funkcja dodająca nowego zwierzaka do bazy danych Firestore.
 * @param petData Dane zwierzaka (name, collar, userId) BEZ linku image
 * @param imageFile Surowy plik typu File z inputu HTML
 * @returns Promise<Pet> Zwraca obiekt zwierzaka uzupełniony o wygenerowane id oraz publiczny url zdjęcia
 */
export const addPet = async (petData: Omit<NewPet, 'image'>, imageFile: any): Promise<Pet> => {
  try {
    const fileExt = imageFile.name.split('.').pop();
    const uniqueFileName = `${petData.userId}-${Date.now()}.${fileExt}`;
    const filePath = `pets-photos/${uniqueFileName}`;

    let fileBody;

    // Obsługa środowiska Web (localhost) oraz telefonu
    if (imageFile.uri.startsWith('blob:') || imageFile.uri.startsWith('http')) {
      const response = await fetch(imageFile.uri);
      fileBody = await response.arrayBuffer(); // Konwersja na format bezpieczny dla przeglądarki
    } else {
      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        name: uniqueFileName,
        type: imageFile.type,
      } as any);
      fileBody = formData;
    }

    // WYSYŁKA DO SUPABASE z wymuszeniem poprawnego typu (MIME type)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pet_pics')
      .upload(filePath, fileBody, {
        contentType: imageFile.type || 'image/jpeg', // <-- TO ROZWIĄZUJE PROBLEM OCTET-STREAM
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Błąd uploadu Supabase: ${uploadError.message}`);
    }

    // Pobieranie publicznego linku URL z Supabase
    const { data } = supabase.storage
      .from('pet_pics')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    // Zapis kompletnych danych (z poprawnym linkiem) do Firestore
    const fullPetData: NewPet = {
      ...petData,
      image: publicUrl
    };

    const petsCollection = collection(db, 'pets');
    const docRef = await addDoc(petsCollection, fullPetData);

    return { id: docRef.id, ...fullPetData };
  } catch (error) {
    console.error("Błąd w addPet:", error);
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

export const updatePet = async (petId: string, updatedData: Partial<Omit<Pet, 'image'>>, newImageFile?: any): Promise<void> => {
  try {
    let imageUrl: string | undefined;

    // Jeśli użytkownik wybrał nowe zdjęcie, wgrywamy je identycznie jak w addPet
    if (newImageFile) {
      const fileExt = newImageFile.name.split('.').pop();
      const uniqueFileName = `${updatedData.userId || '1'}-${Date.now()}.${fileExt}`;
      const filePath = `pets-photos/${uniqueFileName}`;

      let fileBody;
      if (newImageFile.uri.startsWith('blob:') || newImageFile.uri.startsWith('http')) {
        const response = await fetch(newImageFile.uri);
        fileBody = await response.arrayBuffer();
      } else {
        const formData = new FormData();
        formData.append('file', {
          uri: newImageFile.uri,
          name: uniqueFileName,
          type: newImageFile.type,
        } as any);
        fileBody = formData;
      }

      const { error: uploadError } = await supabase.storage
        .from('pet_pics')
        .upload(filePath, fileBody, {
          contentType: newImageFile.type || 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw new Error(`Błąd uploadu Supabase: ${uploadError.message}`);

      const { data } = supabase.storage.from('pet_pics').getPublicUrl(filePath);
      imageUrl = data.publicUrl;
    }

    // Aktualizacja w Firestore
    const petDocRef = doc(db, 'pets', petId);
    const finalData = imageUrl ? { ...updatedData, image: imageUrl } : updatedData;

    await updateDoc(petDocRef, finalData);
  } catch (error) {
    console.error("Błąd w updatePet:", error);
    throw error;
  }
};

// Funkcja usuwania zwierzaka
export const deletePet = async (petId: string): Promise<void> => {
  try {
    const petDocRef = doc(db, 'pets', petId);
    await deleteDoc(petDocRef);
  } catch (error) {
    console.error("Błąd w deletePet:", error);
    throw error;
  }
};
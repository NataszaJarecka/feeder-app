import { createClient } from '@supabase/supabase-js';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer // <-- DODANY IMPORT DLA WYDAJNEGO ZLICZANIA
  ,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// 1. Inicjalizacja klienta Supabase
const SUPABASE_URL = 'https://skprsjpylwpktvczmrkl.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'sb_publishable_Vcp4dKaoMGZXteoWbY-q2A_FMg9sTcy';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Definiujemy strukturę danych zwierzaka dla TypeScriptu
export interface Pet {
  id: string;
  name: string;
  collar: string;
  image: string;
  userId: string;
}

export type NewPet = Omit<Pet, 'id'>;

// Funkcja pobierająca zwierzaki przypisane do danego userId
export const getPetsByUser = async (userId: string): Promise<Pet[]> => {
  try {
    const petsCollection = collection(db, 'pets');
    const q = query(petsCollection, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const petsList: Pet[] = [];

    querySnapshot.forEach((doc) => {
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
 */
export const addPet = async (petData: Omit<NewPet, 'image'>, imageFile: any): Promise<Pet> => {
  try {
    const fileExt = imageFile.name.split('.').pop();
    const uniqueFileName = `${petData.userId}-${Date.now()}.${fileExt}`;
    const filePath = `pets-photos/${uniqueFileName}`;

    let fileBody;

    if (imageFile.uri.startsWith('blob:') || imageFile.uri.startsWith('http')) {
      const response = await fetch(imageFile.uri);
      fileBody = await response.arrayBuffer();
    } else {
      const formData = new FormData();
      formData.append('file', {
        uri: imageFile.uri,
        name: uniqueFileName,
        type: imageFile.type,
      } as any);
      fileBody = formData;
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pet_pics')
      .upload(filePath, fileBody, {
        contentType: imageFile.type || 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Błąd uploadu Supabase: ${uploadError.message}`);
    }

    const { data } = supabase.storage
      .from('pet_pics')
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

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

    const petDocRef = doc(db, 'pets', petId);
    const finalData = imageUrl ? { ...updatedData, image: imageUrl } : updatedData;

    await updateDoc(petDocRef, finalData);
  } catch (error) {
    console.error("Błąd w updatePet:", error);
    throw error;
  }
};

/**
 * Usuwa zwierzaka oraz kaskadowo wszystkie jego posiłki z bazy danych
 */
export const deletePetWithMeals = async (petId: string): Promise<void> => {
  try {
    const mealsRef = collection(db, 'meals');
    const q = query(mealsRef, where('petId', '==', petId));
    const querySnapshot = await getDocs(q);

    const batch = writeBatch(db);

    querySnapshot.forEach((mealDoc) => {
      batch.delete(mealDoc.ref);
    });

    await batch.commit();
    console.log(`Pomyślnie usunięto wszystkie posiłki dla zwierzaka: ${petId}`);

    const petDocRef = doc(db, 'pets', petId);
    await deleteDoc(petDocRef);
    console.log(`Pomyślnie usunięto zwierzaka: ${petId}`);

  } catch (error) {
    console.error("Błąd podczas kaskadowego usuwania zwierzaka i posiłków:", error);
    throw error;
  }
};

/**
 * NOWA FUNKCJA: Pobiera z serwera liczbę zwierzaków należących do użytkownika.
 * Robi to bez pobierania całych dokumentów (bardzo wydajne rozwiązanie).
 * @param userId ID zalogowanego użytkownika
 * @returns Promise<number> Liczba posiadanych zwierzaków
 */
export const getPetsCountByUser = async (userId: string): Promise<number> => {
  try {
    const petsCollection = collection(db, 'pets');
    const q = query(petsCollection, where('userId', '==', userId));

    // Pobieramy tylko snapshot agregujący z serwera
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Błąd podczas zliczania zwierzaków użytkownika:", error);
    return 0; // W razie błędu zwracamy bezpieczne 0
  }
};
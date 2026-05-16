import React, { createContext, ReactNode, useContext, useState } from 'react';

// --- 1. DEFINICJE TYPÓW (Co przechowujemy) ---
export type Pet = {
  id: string;
  name: string;
  breed: string;
  image: any; // tu będzie require(...)
};

export type Meal = {
  id: string;
  petId: string;
  time: Date;
  portion: string;
  color: string;
};

// Co udostępniamy całej aplikacji
type AppContextType = {
  pets: Pet[];
  meals: Meal[];
  addPet: (name: string, breed: string) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
};

// --- 2. TWORZENIE KONTEKSTU ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- 3. DOSTAWCA (PROVIDER) ---
export function AppProvider({ children }: { children: ReactNode }) {
  // Stan dla zwierząt - na start dajemy Maxa i Mikę
  const [pets, setPets] = useState<Pet[]>([
    { id: '1', name: 'Max', breed: 'Shiba Inu', image: require('@/assets/images/dog-photo.jpg') },
    { id: '2', name: 'Mika', breed: 'Mixed', image: require('@/assets/images/mika-photo.jpg') },
  ]);

  // Stan dla posiłków - na start pusto
  const [meals, setMeals] = useState<Meal[]>([]);

  // Funkcja dodawania psa
  const addPet = (name: string, breed: string) => {
    const newPet: Pet = {
      id: Date.now().toString(),
      name,
      breed,
      image: require('@/assets/images/dog-photo.jpg'), // tymczasowo to samo foto
    };
    setPets([...pets, newPet]);
  };

  // Funkcja dodawania posiłku
  const addMeal = (mealData: Omit<Meal, 'id'>) => {
    const newMeal: Meal = {
      ...mealData,
      id: Date.now().toString(),
    };
    setMeals([...meals, newMeal]);
  };

  return (
    <AppContext.Provider value={{ pets, meals, addPet, addMeal }}>
      {children}
    </AppContext.Provider>
  );
}

// --- 4. HOOK (Żeby łatwo wyciągać dane w plikach) ---
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp musi być użyte wewnątrz AppProvider');
  }
  return context;
};
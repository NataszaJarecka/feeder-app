import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Pet = {
  id: string;
  name: string;
  breed: string;
  image: any;
};

export type Meal = {
  id: string;
  petId: string;
  time: Date;
  portion: string;
  color: string;
};

type AppContextType = {
  pets: Pet[];
  meals: Meal[];
  addPet: (name: string, breed: string) => void;
  addMeal: (meal: Omit<Meal, 'id'>) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([
    { id: '1', name: 'Max', breed: 'Shiba Inu', image: require('@/assets/images/dog-photo.jpg') },
    { id: '2', name: 'Mika', breed: 'Mixed', image: require('@/assets/images/mika-photo.jpg') },
  ]);

  const [meals, setMeals] = useState<Meal[]>([]);

  const addPet = (name: string, breed: string) => {
    const newPet: Pet = {
      id: Date.now().toString(),
      name,
      breed,
      image: require('@/assets/images/dog-photo.jpg'),
    };
    setPets([...pets, newPet]);
  };

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

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp musi być użyte wewnątrz AppProvider');
  }
  return context;
};
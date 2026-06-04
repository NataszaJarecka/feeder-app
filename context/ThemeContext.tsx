import React, { createContext, useContext, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import { AppThemeMode, saveUserThemePreference } from '../services/userService';

type ThemeContextType = {
  themeMode: AppThemeMode;
  currentTheme: 'light' | 'dark';
  setThemeMode: (mode: AppThemeMode) => void;
  updateTheme: (mode: AppThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useSystemColorScheme() ?? 'light';
  const [themeMode, setThemeMode] = useState<AppThemeMode>('system');

  const updateTheme = async (mode: AppThemeMode) => {
    setThemeMode(mode);
    await saveUserThemePreference(mode);
  };

  const currentTheme = themeMode === 'system' ? systemColorScheme : themeMode;

  return (
    <ThemeContext.Provider value={{ themeMode, currentTheme, setThemeMode, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useAppTheme must be used within a ThemeProvider');
  return context;
};
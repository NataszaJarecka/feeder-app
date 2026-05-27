const tintColorLight = '#FF8C42'; // Twój główny pomarańczowy kolor
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    cardBackground: '#FFF3EA', // Jasnopomarańczowe tła kafelków
    border: '#f0f0f0',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718', // Ciemne tło aplikacji
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    cardBackground: '#26292B', // Ciemniejsze tła kafelków w trybie nocnym
    border: '#313538',
  },
};
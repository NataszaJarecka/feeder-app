import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const ThemeScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { themeMode, currentTheme, updateTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  // Przetłumaczone etykiety opcji motywu
  const themeOptions = [
    { id: 'light', label: 'Jasny', icon: 'sunny-outline' },
    { id: 'dark', label: 'Ciemny', icon: 'moon-outline' },
    { id: 'system', label: 'Domyślny', icon: 'cog-outline' },
  ] as const;

  return (
    <ThemedView style={[styles.container, { backgroundColor: currentColors.background }]}>

      <View style={[
        styles.header,
        {
          paddingTop: insets.top + 15,
          backgroundColor: theme === 'dark' ? '#1E2123' : '#FFFFFF',
          shadowColor: theme === 'dark' ? '#FFFFFF' : '#000000',
          shadowOpacity: theme === 'dark' ? 0.35 : 0.12,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: theme === 'dark' ? 5 : 4,
          elevation: theme === 'dark' ? 10 : 4,
        }
      ]}>
        <TouchableOpacity onPress={() => router.replace('/settings' as any)} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={28} color={currentColors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ backgroundColor: currentColors.background }}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('@/assets/images/paw-pattern.png')}
          style={[styles.bgPaw, styles.pawTopRight]}
          resizeMode="contain"
          tintColor={theme === 'dark' ? '#FFF' : undefined}
        />
        <Image
          source={require('@/assets/images/paw-pattern.png')}
          style={[styles.bgPaw, styles.pawMidLeft]}
          resizeMode="contain"
          tintColor={theme === 'dark' ? '#FFF' : undefined}
        />
        <Image
          source={require('@/assets/images/paw-pattern.png')}
          style={[styles.bgPaw, styles.pawMidRight]}
          resizeMode="contain"
          tintColor={theme === 'dark' ? '#FFF' : undefined}
        />
        <Image
          source={require('@/assets/images/paw-pattern.png')}
          style={[styles.bgPaw, styles.pawBottomLeft]}
          resizeMode="contain"
          tintColor={theme === 'dark' ? '#FFF' : undefined}
        />

        <Text style={[styles.mainTitle, { color: currentColors.text }]}>Motyw</Text>

        <View style={styles.optionsContainer}>
          {themeOptions.map((option) => {
            const isActive = themeMode === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: theme === 'dark' ? '#26292B' : '#FFF' },
                  isActive && styles.activeCard
                ]}
                onPress={() => updateTheme(option.id)}
              >
                <View style={styles.cardContent}>
                  <View style={[styles.iconWrapper, isActive && styles.activeIconWrapper]}>
                    <Ionicons
                      name={option.icon}
                      size={26}
                      color="white"
                    />
                  </View>
                  <Text style={[styles.optionLabel, { color: currentColors.text }, isActive && styles.activeLabel]}>
                    {option.label}
                  </Text>
                </View>

                {isActive && (
                  <Ionicons name="checkmark-circle" size={26} color="#E99664" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  headerSide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
  },
  bgPaw: {
    position: 'absolute',
    width: 200,
    height: 200,
    opacity: 0.6,
    zIndex: -1,
  },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 100,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 30,
    marginBottom: 40,
    textAlign: 'center',
  },
  optionsContainer: {
    width: width * 0.85,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeCard: {
    borderColor: '#E99664',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: '#A0A0A0',
    padding: 10,
    borderRadius: 15,
    marginRight: 20,
  },
  activeIconWrapper: {
    backgroundColor: '#E99664',
  },
  optionLabel: {
    fontSize: 20,
    fontWeight: '300',
  },
  activeLabel: {
    fontWeight: '500',
  },
});

export default ThemeScreen;
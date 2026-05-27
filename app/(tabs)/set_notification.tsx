import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext'; // <-- IMPORT KONTEKSTU MOTYWÓW

const { width } = Dimensions.get('window');

const NotificationSettingsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Pobieramy motyw aplikacji z Twojego kontekstu
  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  // Stany dla przełączników
  const [isEnabled, setIsEnabled] = useState(true);
  const [mealAlerts, setMealAlerts] = useState(true);
  const [feederAlerts, setFeederAlerts] = useState(false);

  const toggleMainSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <ThemedView style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* HEADER Z DYNAMICZNYMI KOLORAMI I SPÓJNYM CIENIEM */}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TŁO - ŁAPY (Zmieniają kolor na biały w trybie ciemnym) */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        {/* TYTUŁ - DYNAMICZNY KOLOR */}
        <Text style={[styles.mainTitle, { color: currentColors.text }]}>Notifications</Text>

        {/* KARTA ZBIORCZA USTAWIEŃ */}
        <View style={[styles.settingsWrapper, { backgroundColor: theme === 'dark' ? '#26292B' : 'white' }]}>

          {/* GŁÓWNY PRZEŁĄCZNIK */}
          <View style={styles.settingCard}>
            <View style={styles.textContainer}>
              <Text style={[styles.settingTitle, { color: currentColors.text }]}>Allow Notifications</Text>
              <Text style={[styles.settingSub, { color: theme === 'dark' ? '#A0A0A0' : '#888' }]}>Master switch for all alerts</Text>
            </View>
            <Switch
              trackColor={{ false: "#D1D1D1", true: "#FAD7C2" }}
              thumbColor={isEnabled ? "#E99664" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleMainSwitch}
              value={isEnabled}
            />
          </View>

          <View style={[styles.divider, { opacity: isEnabled ? 1 : 0.3, backgroundColor: theme === 'dark' ? '#333' : '#EEE' }]} />

          {/* SEKCJA SZCZEGÓŁOWA */}
          <View style={{ opacity: isEnabled ? 1 : 0.5 }}>
            <View style={styles.settingCard}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: currentColors.text }]}>Unfinished Meals</Text>
                <Text style={[styles.settingSub, { color: theme === 'dark' ? '#A0A0A0' : '#888' }]}>Notify if pets leave food</Text>
              </View>
              <Switch
                trackColor={{ false: "#D1D1D1", true: "#FAD7C2" }}
                thumbColor={mealAlerts ? "#E99664" : "#f4f3f4"}
                onValueChange={() => setMealAlerts(!mealAlerts)}
                value={mealAlerts}
                disabled={!isEnabled}
              />
            </View>

            <View style={styles.settingCard}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: currentColors.text }]}>Feeder Status</Text>
                <Text style={[styles.settingSub, { color: theme === 'dark' ? '#A0A0A0' : '#888' }]}>Alert when food level is low</Text>
              </View>
              <Switch
                trackColor={{ false: "#D1D1D1", true: "#FAD7C2" }}
                thumbColor={feederAlerts ? "#E99664" : "#f4f3f4"}
                onValueChange={() => setFeederAlerts(!feederAlerts)}
                value={feederAlerts}
                disabled={!isEnabled}
              />
            </View>
          </View>

        </View>

        {/* PRZYCISK ZAPISZ */}
        <TouchableOpacity
          style={[styles.saveButton, { opacity: isEnabled ? 1 : 0.7 }]}
          onPress={() => router.replace('/settings' as any)}
        >
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  // Zunifikowana szerokość 40 dla idealnego centrowania logo iFeeder
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
    opacity: 0.4,
    zIndex: -1,
  },
  pawTopRight: { top: 50, right: -20, transform: [{ rotate: '15deg' }] },
  pawBottomLeft: { bottom: 50, left: -20, transform: [{ rotate: '-20deg' }] },
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
  settingsWrapper: {
    width: width * 0.9,
    borderRadius: 30,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  settingSub: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginHorizontal: 15,
  },
  saveButton: {
    backgroundColor: '#E99664',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    marginTop: 50,
    elevation: 3,
  },
  saveText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default NotificationSettingsScreen;
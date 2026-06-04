import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const NotificationSettingsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [isEnabled, setIsEnabled] = useState(true);
  const [mealAlerts, setMealAlerts] = useState(true);
  const [feederAlerts, setFeederAlerts] = useState(false);

  const toggleMainSwitch = () => setIsEnabled(previousState => !previousState);

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        <Text style={[styles.mainTitle, { color: currentColors.text }]}>Powiadomienia</Text>

        <View style={[styles.settingsWrapper, { backgroundColor: theme === 'dark' ? '#26292B' : 'white' }]}>

          <View style={styles.settingCard}>
            <View style={styles.textContainer}>
              <Text style={[styles.settingTitle, { color: currentColors.text }]}>Zezwól na powiadomienia</Text>
              <Text style={[styles.settingSub, { color: theme === 'dark' ? '#A0A0A0' : '#888' }]}>Główny przełącznik dla wszystkich alertów</Text>
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

          <View style={{ opacity: isEnabled ? 1 : 0.5 }}>
            <View style={styles.settingCard}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingTitle, { color: currentColors.text }]}>Niedokończone posiłki</Text>
                <Text style={[styles.settingSub, { color: theme === 'dark' ? '#A0A0A0' : '#888' }]}>Powiadom, jeśli zwierzak zostawi jedzenie</Text>
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
                <Text style={[styles.settingTitle, { color: currentColors.text }]}>Awarie i status karmnika</Text>
                <Text style={[styles.settingSub, { color: theme === 'dark' ? '#A0A0A0' : '#888' }]}>Alertuj w przypadku problemów technicznych lub braku połączenia</Text>
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

        <TouchableOpacity
          style={[styles.saveButton, { opacity: isEnabled ? 1 : 0.7 }]}
          onPress={() => router.replace('/settings' as any)}
        >
          <Text style={styles.saveText}>Zapisz zmiany</Text>
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
  pawTopRight: {
    top: 10,
    right: 20,
    transform: [{ rotate: '15deg' }],
  },
  pawMidLeft: {
    top: 250,
    left: 20,
    transform: [{ rotate: '-10deg' }],
  },
  pawMidRight: {
    top: 500,
    right: 30,
    transform: [{ rotate: '5deg' }],
  },
  pawBottomLeft: {
    top: 750,
    left: 20,
    transform: [{ rotate: '-20deg' }],
  },
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
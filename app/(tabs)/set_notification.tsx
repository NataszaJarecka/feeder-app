import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const { width } = Dimensions.get('window');

const NotificationSettingsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Stany dla przełączników
  const [isEnabled, setIsEnabled] = useState(true);
  const [mealAlerts, setMealAlerts] = useState(true);
  const [feederAlerts, setFeederAlerts] = useState(false);

  const toggleMainSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TŁO - ŁAPY */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

        {/* TYTUŁ */}
        <Text style={styles.mainTitle}>Notifications</Text>

        <View style={styles.settingsWrapper}>

          {/* GŁÓWNY PRZEŁĄCZNIK */}
          <View style={styles.settingCard}>
            <View style={styles.textContainer}>
              <Text style={styles.settingTitle}>Allow Notifications</Text>
              <Text style={styles.settingSub}>Master switch for all alerts</Text>
            </View>
            <Switch
              trackColor={{ false: "#D1D1D1", true: "#FAD7C2" }}
              thumbColor={isEnabled ? "#E99664" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleMainSwitch}
              value={isEnabled}
            />
          </View>

          <View style={[styles.divider, { opacity: isEnabled ? 1 : 0.3 }]} />

          {/* SEKCJA SZCZEGÓŁOWA (blokowana gdy główny switch jest off) */}
          <View style={{ opacity: isEnabled ? 1 : 0.5 }}>
            <View style={styles.settingCard}>
              <View style={styles.textContainer}>
                <Text style={styles.settingTitle}>Unfinished Meals</Text>
                <Text style={styles.settingSub}>Notify if pets leave food</Text>
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
                <Text style={styles.settingTitle}>Feeder Status</Text>
                <Text style={styles.settingSub}>Alert when food level is low</Text>
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
          onPress={() => router.push('/settings')}
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
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
  },
  settingsWrapper: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 10,
    // Stylizacja karty zbiorczej (cień)
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
    color: '#000',
  },
  settingSub: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
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
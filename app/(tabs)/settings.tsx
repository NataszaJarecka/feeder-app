import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { auth } from '../../firebaseConfig'; // dostosuj ścieżkę

const { width } = Dimensions.get('window');

const SettingsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Definicja opcji ustawień dla łatwiejszego renderowania
  const settingsOptions = [
    { id: 'account', label: 'My account', icon: 'person-outline' },
    { id: 'language', label: 'Language', icon: 'language-outline' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* HEADER - Identyczny jak w Statistics */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <View style={styles.headerSide} />
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <TouchableOpacity onPress={() => router.push('/notification')} style={styles.headerSide}>
          <Ionicons name="notifications" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TŁO - ŁAPY (Identyczne rozstawienie) */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

        {/* TYTUŁ SEKCJI */}
        <Text style={styles.mainTitle}>Settings</Text>

        {/* LISTA USTAWIEŃ */}
        <View style={styles.settingsList}>
          {settingsOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.settingCard}
              onPress={() => {
                if (item.id === 'account') {
                  router.push('/my_account' as any);
                } else if (item.id === 'language') {
                  router.push('/language' as any);
                }

                else if (item.id === 'notifications') {
                  router.push('/set_notification' as any);
                }
                // Add other navigations if needed
              }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <Ionicons name={item.icon as any} size={30} color="white" />
                </View>
                <Text style={styles.settingLabel}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* PRZYCISK LOGOUT (Opcjonalny dodatek dla pełnego designu) */}
        <TouchableOpacity
     style={styles.logoutBtn}
     onPress={async () => {
       try {
         await signOut(auth);
         // Nie musisz robić router.push!
         // Główny plik _layout.tsx sam zauważy wylogowanie i natychmiast ukryje pasek i pokaze login screen.
       } catch (error) {
         Alert.alert('Błąd', 'Nie udało się wylogować.');
       }
     }}
   >
     <Text style={styles.logoutText}>Log out</Text>
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
    // Cień identyczny jak w Twoim kodzie
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  headerSide: {
    width: 32,
    alignItems: 'flex-end',
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
    color: '#000',
  },
  settingsList: {
    width: width * 0.85,
  },
  settingCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    // Cień kart
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: '#E99664', // Kolor przewodni iFeeder
    padding: 10,
    borderRadius: 15,
    marginRight: 20,
  },
  settingLabel: {
    fontSize: 22,
    fontWeight: '300',
    color: '#000',
  },
  logoutBtn: {
    marginTop: 20,
    padding: 15,
  },
  logoutText: {
    fontSize: 20,
    color: '#E99664',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default SettingsScreen;
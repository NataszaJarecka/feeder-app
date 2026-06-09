import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';

// Importy z Firebase Firestore (dodane addDoc do generowania testów)
import { addDoc, collection, doc, getDoc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// Import metod z serwisu
import { clearAbsolutelyAllNotifications, DBNotification, DisplayNotification } from '../../services/notificationService';

interface ExtendedDisplayNotification extends DisplayNotification {
  avatarUrl?: string;
}

const { width } = Dimensions.get('window');

const NotificationsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [notifications, setNotifications] = useState<ExtendedDisplayNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [clearing, setClearing] = useState<boolean>(false);
  const [userDeviceId, setUserDeviceId] = useState<string>('');

  // NASŁUCHIWANIE W CZASIE RZECZYWISTYM (onSnapshot)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribe: () => void = () => {};

    const setupRealtimeNotifications = async () => {
      try {
        // 1. Pobieramy ID urządzenia przypisanego do użytkownika
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const deviceId = userData.deviceId;

        // Zapisujemy ID urządzenia w stanie, żeby przycisk testowy mógł z niego skorzystać
        if (deviceId) {
          setUserDeviceId(deviceId);
        }

        if (!deviceId || deviceId.trim() === '') {
          console.log('Użytkownik nie ma przypisanego karmnika.');
          setLoading(false);
          return;
        }

        // 2. Budujemy zapytanie do kolekcji notifications
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('deviceId', '==', deviceId),
          where('cleared', '==', false),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const petCache: Record<string, { name: string; image: string }> = {};

        // 3. Otwieramy strumień danych z Firebase
        unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const rawNotifications: DBNotification[] = [];
          querySnapshot.forEach((docSnap) => {
            rawNotifications.push({ id: docSnap.id, ...docSnap.data() } as DBNotification);
          });

          const displayNotifications: DisplayNotification[] = [];

          for (const notif of rawNotifications) {
            let petName = 'Pet';
            let petImage = '';

            if (notif.petId) {
              if (petCache[notif.petId]) {
                petName = petCache[notif.petId].name;
                petImage = petCache[notif.petId].image;
              } else {
                try {
                  const petDocRef = doc(db, 'pets', notif.petId);
                  const petSnap = await getDoc(petDocRef);
                  if (petSnap.exists()) {
                    const petData = petSnap.data();
                    petName = petData.name || 'Pet';
                    petImage = petData.image || '';
                    petCache[notif.petId] = { name: petName, image: petImage };
                  }
                } catch (e) {
                  console.warn(`Nie udało się pobrać danych zwierzaka o ID: ${notif.petId}`, e);
                }
              }
            }

            const dateObj = new Date(notif.createdAt * 1000);
            const timeStr = dateObj.toLocaleTimeString('pl', { hour: '2-digit', minute: '2-digit', hour12: false });
            const dateStr = dateObj.toLocaleDateString('pl', { day: 'numeric', month: 'short' });
            const fullTime = `${dateStr}, ${timeStr}`;

            if (notif.type === 'FEEDING_SUCCESS') {
              displayNotifications.push({
                id: notif.id,
                time: fullTime,
                type: 'pet',
                name: petName,
                msg: 'zjadł(a) posiłek.',
                petId: notif.petId,
                avatarUrl: petImage
              });
            } else if (notif.type === 'FEEDING_FAIL') {
              displayNotifications.push({
                id: notif.id,
                time: fullTime,
                type: 'pet',
                name: petName,
                msg: "nie skończył(a) posiłku!",
                petId: notif.petId,
                avatarUrl: petImage
              });
            } else if (notif.type === 'FEEDING_COMPLETED') {
              // NOWY TYP: Urządzenie pomyślnie wydało posiłek
              displayNotifications.push({
                id: notif.id,
                time: fullTime,
                type: 'info', // Zastosowane jako ogólne info, wyświetli ikonę powiadomienia zamiast wykrzyknika
                msg: 'Podano posiłek.',
                subMsg: 'Karmnik pomyślnie wydał zaplanowaną porcję.'
              });
            } else if (notif.type === 'FEEDING_ERROR') {
              displayNotifications.push({
                id: notif.id,
                time: fullTime,
                type: 'alert',
                msg: 'Nie udało się podać posiłku!',
                subMsg: 'Coś się zacięło. Sprawdź podajnik na karmę.'
              });
            }
          }

          setNotifications(displayNotifications);
          setLoading(false);
        }, (error) => {
          console.error("Błąd subskrypcji powiadomień w czasie rzeczywistym:", error);
          setLoading(false);
        });

      } catch (err) {
        console.error("Błąd ustawiania nasłuchu powiadomień:", err);
        setLoading(false);
      }
    };

    setupRealtimeNotifications();

    return () => unsubscribe();
  }, []);

  // GLOBALNE CZYSZCZENIE BAZY DANYCH
  const handleClearAll = async () => {
    if (notifications.length === 0 || clearing) return;

    try {
      setClearing(true);
      await clearAbsolutelyAllNotifications();
    } catch (error) {
      console.error("Błąd podczas czyszczenia powiadomień na ekranie:", error);
    } finally {
      setClearing(false);
    }
  };

  // FUNKCJA GENERUJĄCA REKORD TESTOWY DO BAZY Firestore
  const handleInjectTestNotification = async () => {
    try {
      await addDoc(collection(db, 'notifications'), {
        cleared: false,
        createdAt: Math.floor(Date.now() / 1000),
        deviceId: userDeviceId || "test-device-id",
        type: "FEEDING_COMPLETED" // Zmieniono na Twój nowy typ do testów
      });
      console.log("🚀 Pomyślnie dodano powiadomienie testowe FEEDING_COMPLETED do Firestore!");
    } catch (e) {
      console.error("Błąd podczas wstrzykiwania dokumentu testowego:", e);
    }
  };

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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={28} color={currentColors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>

        <View style={styles.headerSide}>
          <Ionicons name="notifications" size={28} color="#E99664" />
        </View>
      </View>

      {/* ZIELONY PRZYCISK DEWELOPERSKI DO GENEROWANIA POWIADOMIEŃ */}


      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        <View style={styles.content}>

          {notifications.length > 0 && (
            <TouchableOpacity
              style={[styles.clearAllBtn, clearing && { opacity: 0.5 }]}
              onPress={handleClearAll}
              disabled={clearing}
            >
              <Text style={[styles.clearAllText, { color: theme === 'dark' ? '#A0A0A0' : '#666' }]}>
                {clearing ? 'czyszczenie...' : 'wyczyść wszystko'}
              </Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#E99664" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={[styles.noNotificationsText, { color: theme === 'dark' ? '#7A7A7A' : '#A0A0A0' }]}>
                Brak nowych powiadomień
              </Text>
            </View>
          ) : (
            notifications.map((item) => (
              <View key={item.id} style={styles.notificationWrapper}>
                <Text style={[styles.timeLabel, { color: theme === 'dark' ? '#A0A0A0' : '#333' }]}>{item.time}</Text>

                <View style={[styles.card, { backgroundColor: '#EEA179' }]}>
                  {item.type === 'pet' ? (
                    <>
                      <View style={styles.avatarPlaceholder}>
                        {item.avatarUrl ? (
                          <Image
                            source={{ uri: item.avatarUrl }}
                            style={styles.petAvatar}
                          />
                        ) : (
                          <Ionicons name="paw" size={32} color="#EEA179" />
                        )}
                      </View>
                      <Text style={styles.notificationText}>
                        <Text style={{ fontWeight: '500' }}>{item.name}</Text> {item.msg}
                      </Text>
                    </>
                  ) : (
                    <View style={styles.alertContent}>
                      <View style={styles.alertIconContainer}>
                        {item.type === 'alert' ? (
                          <Text style={styles.exclamationMark}>!</Text>
                        ) : (
                          <Ionicons name="checkmark-circle-outline" size={45} color="white" />
                        )}
                      </View>
                      <View style={styles.alertTextContainer}>
                        <Text style={styles.alertTitle}>{item.msg}</Text>
                        <Text style={styles.alertSubTitle}>{item.subMsg}</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  headerSide: { width: 40, height: 40, justifyContent: 'center' },
  logo: { fontSize: 32, fontWeight: 'bold', fontStyle: 'italic', flex: 1, textAlign: 'center' },
  devButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
  },
  devButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  bgPaw: { position: 'absolute', width: 200, height: 200, opacity: 0.6, zIndex: -1 },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  scrollContent: { paddingBottom: 40 },
  content: { paddingHorizontal: 20 },
  clearAllBtn: { alignSelf: 'flex-start', marginVertical: 15 },
  clearAllText: { fontSize: 22, fontWeight: '300' },
  notificationWrapper: { marginBottom: 20 },
  timeLabel: { fontSize: 18, marginLeft: 30, marginBottom: 5 },
  card: { borderRadius: 30, flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 15, minHeight: 90 },
  avatarPlaceholder: { width: 65, height: 65, borderRadius: 32.5, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  petAvatar: { width: '100%', height: '100%', resizeMode: 'cover' },
  notificationText: { flex: 1, color: 'white', fontSize: 22, marginLeft: 15, fontWeight: '300', textAlign: 'center' },
  alertContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  alertIconContainer: { width: 60, alignItems: 'center', justifyContent: 'center' },
  exclamationMark: { fontSize: 60, color: 'white', fontWeight: 'bold', lineHeight: 65 },
  alertTextContainer: { flex: 1, alignItems: 'center' },
  alertTitle: { color: 'white', fontSize: 22, textAlign: 'center' },
  alertSubTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 18, textAlign: 'center' },
  centerContainer: { marginVertical: 100, alignItems: 'center', justifyContent: 'center', width: width - 40 },
  noNotificationsText: { fontSize: 20, fontWeight: '300' }
});

export default NotificationsScreen;
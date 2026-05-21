import { getPetsByUser } from '@/services/petService';
import { getStatisticsByDate, PetStatistic } from '@/services/statisticService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

// IMPORT CONFIGU FIREBASE
import { auth } from '../../firebaseConfig'; // <-- DODANY IMPORT

const { width } = Dimensions.get('window');

const StatisticsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // STANY DLA DATY I DANYCH
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [pets, setPets] = useState<any[]>([]);
  const [stats, setStats] = useState<PetStatistic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // STAN ROZWINIĘCIA KART
  const [expandedPets, setExpandedPets] = useState<Record<string, boolean>>({});

  // 1. Pobieranie zwierzaków powiązanych z REALNYM UID użytkownika
  useEffect(() => {
    const fetchUserPets = async () => {
      // Wyciągamy dynamiczne ID zalogowanego usera z Firebase Auth
      const currentUserId = auth.currentUser?.uid;

      if (!currentUserId) {
        setPets([]);
        setLoading(false);
        return;
      }

      try {
        // Przekazujemy prawdziwe ID do Twojego serwisu
        const userPets = await getPetsByUser(currentUserId);
        setPets(userPets);

        if (userPets.length > 0) {
          setExpandedPets({ [userPets[0].id]: true });
        }
      } catch (error) {
        console.error("Błąd podczas ładowania zwierzaków w komponencie:", error);
      }
    };

    fetchUserPets();
  }, []);

  // 2. Pobieranie statystyk przy każdej zmianie daty lub listy zwierzaków
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await getStatisticsByDate(currentDate);
        setStats(data);
      } catch (error) {
        console.error("Błąd podczas ładowania statystyk w komponencie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentDate, pets]);

  // Zmiana daty o +/- 1 dzień
  const changeDate = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  // Formatowanie nagłówka daty (Nowy format: Thursday, 21 May 2026)
  const formatHeaderDate = (): string => {
    return currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const toggleExpand = (petId: string) => {
    setExpandedPets((prev) => ({ ...prev, [petId]: !prev[petId] }));
  };

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <View style={{ width: 32 }} />
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <TouchableOpacity onPress={() => router.push('/notification')}>
          <Ionicons name="notifications" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

        <Text style={styles.mainTitle}>Statistics</Text>

        {/* SELEKTOR DATY */}
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => changeDate(-1)}>
            <Ionicons name="chevron-back" size={30} color="black" />
          </TouchableOpacity>
          <Text style={styles.dateText}>{formatHeaderDate()}</Text>
          <TouchableOpacity onPress={() => changeDate(1)}>
            <Ionicons name="chevron-forward" size={30} color="black" />
          </TouchableOpacity>
        </View>

        {/* LOADING LUB LISTA KART ZWIERZAKÓW */}
        {loading ? (
          <ActivityIndicator size="large" color="#E99664" style={{ marginTop: 20 }} />
        ) : pets.length === 0 ? (
          <Text style={styles.noStatsText}>You don't have any pets added yet.</Text>
        ) : (
          pets.map((pet) => {
            const petStat = stats.find(
              (s) => s.petId === pet.id
            );
            const isExpanded = !!expandedPets[pet.id];

            return (
              <View key={pet.id} style={styles.cardWrapper}>
                <View style={styles.cardHeader}>
                  <Text style={styles.petName}>{pet.name || "No name"}</Text>
                  <TouchableOpacity onPress={() => toggleExpand(pet.id)}>
                    <MaterialCommunityIcons name={isExpanded ? "minus" : "plus"} size={35} color="white" />
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <View style={styles.cardBody}>
                    {petStat ? (
                      <>
                        <Text style={styles.statLabel}>Meals eaten:</Text>
                        <Text style={styles.statValue}>{petStat.mealsEaten}</Text>

                        <Text style={styles.statLabel}>Unfinished meals:</Text>
                        <Text style={styles.statValue}>{petStat.mealsMissed}</Text>

                        <Text style={styles.statLabel}>Average eating speed:</Text>
                        <Text style={styles.statValue}>{petStat.eatingSpeed} g/s</Text>
                      </>
                    ) : (
                      <Text style={styles.noStatsText}>No statistics available</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  bgPaw: { position: 'absolute', width: 200, height: 200, opacity: 0.6, zIndex: -1 },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 },
  logo: { fontSize: 32, fontWeight: 'bold', fontStyle: 'italic' },
  scrollContent: { alignItems: 'center', paddingBottom: 100 },
  mainTitle: { fontSize: 42, fontWeight: '400', marginTop: 30, marginBottom: 40, color: '#000' },
  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: width * 0.85, marginVertical: 25 },
  dateText: { fontSize: 26, fontWeight: '400', textAlign: 'center', flex: 1 },
  cardWrapper: { width: width * 0.85, backgroundColor: '#FFF', borderRadius: 35, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E99664', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 35 },
  petName: { fontSize: 38, color: 'white', fontWeight: '300' },
  cardBody: { paddingVertical: 20, alignItems: 'center' },
  statLabel: { fontSize: 22, color: '#000', marginTop: 15 },
  statValue: { fontSize: 26, fontWeight: '300', color: '#777', marginTop: 5 },
  noStatsText: { fontSize: 22, fontWeight: '300', color: '#A0A0A0', marginVertical: 30, fontStyle: 'italic' },
});

export default StatisticsScreen;
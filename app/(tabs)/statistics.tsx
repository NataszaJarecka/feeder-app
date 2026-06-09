import { getPetsByUser } from '@/services/petService';
import { getFeedingCountForPet } from '@/services/statisticService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';
import { auth } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

const StatisticsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedPets, setExpandedPets] = useState<Record<string, boolean>>({});
  const [feedingCounts, setFeedingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchUserPets = async () => {
      const currentUserId = auth.currentUser?.uid;

      if (!currentUserId) {
        setPets([]);
        setLoading(false);
        return;
      }

      try {
        const userPets = await getPetsByUser(currentUserId);
        setPets(userPets);

        if (userPets.length > 0) {
          setExpandedPets({ [userPets[0].id]: true });

          // Pobieranie ogólnej liczby karmień dla każdego zwierzaka
          const counts: Record<string, number> = {};
          await Promise.all(
            userPets.map(async (pet) => {
              try {
                const count = await getFeedingCountForPet(pet.id);
                counts[pet.id] = count;
              } catch (err) {
                console.error(`Błąd liczby karmień dla ${pet.id}:`, err);
                counts[pet.id] = 0;
              }
            })
          );
          setFeedingCounts(counts);
        }
      } catch (error) {
        console.error("Błąd podczas ładowania zwierzaków w komponencie:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPets();
  }, []);

  const toggleExpand = (petId: string) => {
    setExpandedPets((prev) => ({ ...prev, [petId]: !prev[petId] }));
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
        <View style={styles.headerSide} />
        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>

        <TouchableOpacity
          onPress={() => router.push('/notification')}
          style={[styles.headerSide, { alignItems: 'flex-end' }]}
        >
          <Ionicons name="notifications" size={28} color={currentColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        <Text style={[styles.mainTitle, { color: currentColors.text }]}>Statystyki</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#E99664" style={{ marginTop: 20 }} />
        ) : pets.length === 0 ? (
          <Text style={styles.noPetsText}>Nie masz jeszcze żadnych zwierzaków.</Text>
        ) : (
          pets.map((pet) => {
            const isExpanded = !!expandedPets[pet.id];
            const totalFeedings = feedingCounts[pet.id] ?? 0;

            return (
              <View
                key={pet.id}
                style={[
                  styles.cardWrapper,
                  { backgroundColor: theme === 'dark' ? '#26292B' : '#FFF' }
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.petName}>{pet.name || "Brak imienia"}</Text>
                  <TouchableOpacity onPress={() => toggleExpand(pet.id)}>
                    <MaterialCommunityIcons name={isExpanded ? "minus" : "plus"} size={35} color="white" />
                  </TouchableOpacity>
                </View>

                {isExpanded && (
                  <View style={styles.cardBody}>
                    <Text style={[styles.statLabel, { color: currentColors.text, fontWeight: '400' }]}>
                      Liczba posiłków zjedzona do tej pory:
                    </Text>
                    <Text style={[styles.statValue, { color: '#E99664', fontWeight: 'bold' }]}>
                      {totalFeedings}
                    </Text>
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
  container: { flex: 1 },
  bgPaw: { position: 'absolute', width: 200, height: 200, opacity: 0.6, zIndex: -1 },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, paddingHorizontal: 20, zIndex: 999 },
  logo: { fontSize: 32, fontWeight: 'bold', fontStyle: 'italic' },
  scrollContent: { alignItems: 'center', paddingBottom: 100 },
  mainTitle: { fontSize: 42, fontWeight: '400', marginTop: 30, marginBottom: 40, textAlign: 'center' },
  cardWrapper: { width: width * 0.85, borderRadius: 35, marginBottom: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#E99664', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 35 },
  petName: { fontSize: 38, color: 'white', fontWeight: '300' },
  cardBody: { paddingVertical: 25, paddingHorizontal: 20, alignItems: 'center' },
  statLabel: { fontSize: 20, textAlign: 'center', marginBottom: 10 },
  statValue: { fontSize: 32, marginTop: 5 },
  noPetsText: { fontSize: 22, fontWeight: '300', color: '#A0A0A0', marginVertical: 30, fontStyle: 'italic' },
  headerSide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
});

export default StatisticsScreen;
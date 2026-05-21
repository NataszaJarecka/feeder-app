import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/themed-view';
import { auth } from '../../firebaseConfig'; // dostosuj ścieżkę

// Importujemy logikę bazy danych i interfejs
import { getPetsByUser, Pet } from '../../services/petService';

// Zmieniamy na stałą szerokość - dzięki temu na szerokim ekranie zmieści się ich więcej
const ITEM_SIZE = 290;

export default function MyPetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Stany dla listy zwierzaków i ładowania
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Szukamy zwierzaków przypisanych do użytkownika "user_1"
  const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
  console.log("ID obecnego użytkownika to:", currentUserId);


  // useFocusEffect wymusza pobranie danych z bazy ZA KAŻDYM RAZEM, gdy ekran staje się aktywny
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      if (Platform.OS !== 'web' || typeof window !== 'undefined') {
        const fetchUserPets = async () => {
          try {
            setLoading(true); // Pokazuje kręciołek przy odświeżaniu danych
            const fetchedPets = await getPetsByUser(currentUserId);
            if (isMounted) {
              setPets(fetchedPets);
            }
          } catch (error) {
            console.error("Błąd pobierania zwierzaków w widoku:", error);
          } finally {
            if (isMounted) {
              setLoading(false);
            }
          }
        };

        fetchUserPets();
      } else {
        setLoading(false);
      }

      return () => {
        isMounted = false;
      };
    }, [currentUserId])
  );

  return (
    <ThemedView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ width: 32 }} />
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <TouchableOpacity onPress={() => router.push('/notification')}>
          <Ionicons name="notifications" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tło (Pazurki) */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />

        <ThemedText style={styles.pageTitle}>My Pets</ThemedText>

        {/* Jeśli trwa ładowanie, pokazujemy kręciołek */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#E99664" />
          </View>
        ) : (
          /* --- SIATKA (GRID) --- */
          <View style={styles.grid}>

            {/* DYNAMICZNA LISTA ZWIERZAKÓW */}
            {pets.map((pet) => {
              const hasValidImage = pet.image && pet.image.trim() !== '' && pet.image.startsWith('http');

              return (
                <View key={pet.id} style={styles.gridItem}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/pet_profile',
                      params: { petId: pet.id }
                    })}
                  >
                    <Image
                      key={pet.image}
                      source={
                        hasValidImage
                          ? {
                              uri: pet.image,
                              headers: { Pragma: 'no-cache' }
                            }
                          : require('@/assets/images/dog_placeholder.png')
                      }
                      style={styles.petImage}
                      // @ts-ignore - poprawka CORS pod przeglądarki internetowe
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn(`Problem z załadowaniem obrazka dla ${pet.name}:`, e.nativeEvent.error);
                      }}
                    />
                  </TouchableOpacity>
                  <ThemedText style={styles.petName}>{pet.name}</ThemedText>
                </View>
              );
            })}

            {/* PRZYCISK DODAWANIA (+) — Zawsze renderuje się na końcu listy */}
            <View style={styles.gridItem}>
              <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add_pet')}>
                <Ionicons name="add" size={50} color="#555" />
              </TouchableOpacity>
              <ThemedText style={styles.petName}>Add</ThemedText>
            </View>

          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    overflow: 'visible',
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
    minHeight: 60,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 42,
    marginTop: 50,
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '400',
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 25,
    paddingHorizontal: 20,
  },
  gridItem: {
    alignItems: 'center',
    width: ITEM_SIZE,
  },
  petImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#eee',
  },
  petName: {
    fontSize: 27,
    marginTop: 8,
    fontWeight: '400',
  },
  addButton: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
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
  centerContainer: {
    marginVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
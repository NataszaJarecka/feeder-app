import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '../../components/themed-view';

// Importujemy logikę bazy danych i interfejs
import { getPetsByUser, Pet } from '../../services/petService';

// Zmieniamy na stałą szerokość - dzięki temu na szerokim ekranie zmieści się ich więcej
const ITEM_SIZE = 290;

export default function MyPetsScreen() {
  const router = useRouter();

  // Stany dla listy zwierzaków i ładowania
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Szukamy zwierzaków przypisanych do użytkownika "user_1"
  const currentUserId = "1";

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window !== 'undefined') {
      const fetchUserPets = async () => {
        try {
          const fetchedPets = await getPetsByUser(currentUserId);
          setPets(fetchedPets);
        } catch (error) {
          console.error("Błąd pobierania zwierzaków w widoku:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchUserPets();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <ThemedView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
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

            {/* DYNAMICZNA LISTA ZWIERZAKÓW Z FIREBASE */}
            {pets.map((pet) => (
              <View key={pet.id} style={styles.gridItem}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push({
                    pathname: '/pet_profile',
                    params: { petId: pet.id }
                  })}
                >
                  <Image
                    // Sprawdzamy czy imageUrl istnieje i nie jest pustym stringiem
                    source={
                      pet.image && pet.image.trim() !== ''
                        ? { uri: pet.image } // Jeśli jest w bazie, ładujemy URL
                        : require('@/assets/images/dog_placeholder.png') // Jeśli brak, ładujemy lokalny placeholder (zmień nazwę pliku jeśli trzeba)
                    }
                    style={styles.petImage}
                  />
                </TouchableOpacity>
                <ThemedText style={styles.petName}>{pet.name}</ThemedText>
              </View>
            ))}

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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
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
  centerContainer: {
    marginVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
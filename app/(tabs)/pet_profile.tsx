import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router'; // 1. Dodajemy useLocalSearchParams
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
// 2. Importujemy nową funkcję oraz interfejs
import { getPetById, Pet } from '../../services/petService';

const ActionButton = ({ title, onPress }: { title: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
    <ThemedText style={styles.actionButtonText} type="defaultSemiBold">
      {title}
    </ThemedText>
  </TouchableOpacity>
);

export default function PetProfileScreen() {
  const router = useRouter();

  // 3. Odbieramy petId przekazane w nawigacji
  const { petId } = useLocalSearchParams<{ petId: string }>();

  // 4. Definiujemy stany na dane i ładowanie
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Mapowanie identyfikatorów obroży na przyjazne dla oka nazwy
  const collarNames: Record<string, string> = {
    blue: 'Blue collar',
    orange: 'Orange collar',
    green: 'Green collar',
    red: 'Red collar',
  };

  useEffect(() => {
    if (!petId) {
      setLoading(false);
      return;
    }

    const fetchPetData = async () => {
      try {
        setLoading(true);
        const petData = await getPetById(petId);
        setPet(petData);
      } catch (error) {
        console.error("Błąd pobierania profilu zwierzaka:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPetData();
  }, [petId]);

  // Jeśli dane się ładują, wyświetlamy kręciołek na środku ekranu
  if (loading) {
    return (
      <ThemedView style={[styles.screenContainer, styles.centerContainer]}>
        <ActivityIndicator size="large" color="#E99664" />
      </ThemedView>
    );
  }

  // Obsługa sytuacji awaryjnej (brak zwierzaka w bazie)
  if (!pet) {
    return (
      <ThemedView style={[styles.screenContainer, styles.centerContainer]}>
        <ThemedText type="subtitle">Pet not found</ThemedText>
        <ActionButton title="Go back" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screenContainer}>
      {/* 1. GÓRNY PASEK (HEADER) */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.iconWrapper} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color="black" />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.brandTitle}>iFeeder</ThemedText>
        <TouchableOpacity style={styles.iconWrapper}>
          <Ionicons name="notifications" size={26} color="black" />
        </TouchableOpacity>
      </View>

      {/* 2. GŁÓWNY OBSZAR TREŚCI */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tło (Pazurki) */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.singlePaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.singlePaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.singlePaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.singlePaw, styles.pawBottomLeft]} resizeMode="contain" />

        {/* TYTUŁ SEKCJI */}
        <View style={styles.sectionTitleRow}>
          <ThemedText type="title" style={styles.sectionTitle}>Pet's profile</ThemedText>
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => router.push({
              pathname: '/edit_pet',
              params: { petId: petId } // Przekazujemy ID zwierzaka dalej
            })}>
            <Ionicons name="pencil-outline" size={26} color="#777" />
          </TouchableOpacity>
        </View>

        {/* ZDJĘCIE PSA */}
        <View style={styles.photoContainer}>
        <Image
            source={
            pet.image && pet.image.trim() !== ''
                ? { uri: pet.image} // Jeśli URL istnieje w bazie, ładujemy go z sieci
                : require('@/assets/images/dog_placeholder.png') // Jeśli baza zwraca pusty URL, używamy lokalnego zdjęcia jako zapasowego
            }
            style={styles.profilePhoto}
        />
        </View>

        {/* DANE PSA - Dynamiczne wartości wyciągnięte z obiektu 'pet' */}
        <View style={styles.petInfo}>
          <ThemedText type="title" style={styles.petName}>{pet.name}</ThemedText>
          <ThemedText style={styles.petDescription} type="default">
            {collarNames[pet.collar] || 'No collar assigned'}
          </ThemedText>
        </View>

        {/* PRZYCISKI AKCJI */}
        <View style={styles.actionButtonsContainer}>
          <ActionButton title="Feeding schedule" onPress={() => router.push('/schedule')} />
          <ActionButton title="Feeding statistics" />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

// --- STYLIZACJA (Uzupełniona o kontener środkujący dla ładowania) ---
const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerBar: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 15,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  singlePaw: {
    position: 'absolute',
    width: 200,
    height: 200,
    opacity: 0.5,
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
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 32,
    marginRight: 10,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  profilePhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f0f0f0',
  },
  petInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  petName: {
    fontSize: 36,
  },
  petDescription: {
    color: '#777',
    fontSize: 16,
    marginTop: 5,
  },
  actionButtonsContainer: {
    alignItems: 'center',
    gap: 15,
  },
  actionButton: {
    backgroundColor: '#E99664',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: '80%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
  },
  iconWrapper: {
    padding: 5,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
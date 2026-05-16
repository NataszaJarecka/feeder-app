import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedView } from '../../components/themed-view';

// Zmieniamy na stałą szerokość - dzięki temu na szerokim ekranie zmieści się ich więcej
const ITEM_SIZE = 120;

export default function MyPetsScreen() {
  const router = useRouter();

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
        {/* Tło (Pazurki) pozostaje bez zmian */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />

        <ThemedText style={styles.pageTitle}>My Pets</ThemedText>

        {/* --- SIATKA (GRID) --- */}
        <View style={styles.grid}>

          {/* MAX / HANS */}
          <View style={styles.gridItem}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/')}
            >
              <Image
                source={require('@/assets/images/dog-photo.jpg')}
                style={styles.petImage}
              />
            </TouchableOpacity>
            <ThemedText style={styles.petName}>Hans</ThemedText>
          </View>

          {/* MIKA */}
          <View style={styles.gridItem}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => console.log('Profil Miki')}
            >
              <Image
                source={require('@/assets/images/mika-photo.jpg')}
                style={styles.petImage}
              />
            </TouchableOpacity>
            <ThemedText style={styles.petName}>Mika</ThemedText>
          </View>

          {/* PRZYCISK DODAWANIA (+) */}
          <View style={styles.gridItem}>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add_pet')}>
              <Ionicons name="add" size={50} color="#555" />
            </TouchableOpacity>
            <ThemedText style={styles.petName}>Add</ThemedText>
          </View>

        </View>
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
    marginTop: 30,
    marginBottom: 40,
    textAlign: 'center',
    fontWeight: '400',
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap', // To pozwala elementom przechodzić do nowej linii
    justifyContent: 'center', // Centruje elementy w linii
    gap: 25, // Odstępy między elementami
    paddingHorizontal: 20,
  },
  gridItem: {
    alignItems: 'center',
    width: ITEM_SIZE, // Stała szerokość kontenera
  },
  petImage: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  petName: {
    fontSize: 18, // Nieco mniejszy font do mniejszych zdjęć
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
    opacity: 0.3,
    zIndex: -1,
  },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  // ... reszta stylów łapek bez zmian
});
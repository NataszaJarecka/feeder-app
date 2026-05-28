import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext'; // <-- IMPORT KONTEKSTU MOTYWÓW
import { getPetById, Pet } from '../../services/petService';

const ActionButton = ({ title, onPress }: { title: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
    <Text style={styles.actionButtonText}>
      {title}
    </Text>
  </TouchableOpacity>
);

export default function PetProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Pobieramy motyw aplikacji z Twojego kontekstu
  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const { petId } = useLocalSearchParams<{ petId: string }>();

  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  if (loading) {
    return (
      <ThemedView style={[styles.screenContainer, { backgroundColor: currentColors.background }, styles.centerContainer]}>
        <ActivityIndicator size="large" color={currentColors.tint} />
      </ThemedView>
    );
  }

  if (!pet) {
    return (
      <ThemedView style={[styles.screenContainer, { backgroundColor: currentColors.background }, styles.centerContainer]}>
        <ThemedText style={{ color: currentColors.text }}>Pet not found</ThemedText>
        <ActionButton title="Go back" onPress={() => router.back()} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.screenContainer, { backgroundColor: currentColors.background }]}>

      {/* 1. GÓRNY PASEK (HEADER) Z SYSTMEM DYNAMICZNEGO CIENIA */}
      <View style={[
        styles.headerBar,
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
        <TouchableOpacity style={styles.iconWrapper} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={26} color={currentColors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.brandTitle, { color: currentColors.text }]}>iFeeder</ThemedText>

        <TouchableOpacity style={styles.iconWrapper} onPress={() => router.push('/notification')}>
          <Ionicons name="notifications" size={26} color={currentColors.text} />
        </TouchableOpacity>
      </View>

      {/* 2. GŁÓWNY OBSZAR TREŚCI */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tło (Pazurki zmieniające kolor na jasny w trybie ciemnym) */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.singlePaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.singlePaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.singlePaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.singlePaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        {/* TYTUŁ SEKCJI */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Pet's profile</Text>
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={() => router.push({
              pathname: '/edit_pet',
              params: { petId: petId }
            })}>
            <Ionicons name="pencil-outline" size={26} color={theme === 'dark' ? '#AAA' : '#777'} />
          </TouchableOpacity>
        </View>

        {/* ZDJĘCIE PSA */}
        <View style={styles.photoContainer}>
          <Image
            source={
              pet.image && pet.image.trim() !== ''
                ? { uri: pet.image}
                : require('@/assets/images/dog_placeholder.png')
            }
            style={[styles.profilePhoto, { borderColor: currentColors.border, backgroundColor: currentColors.border }]}
          />
        </View>

        {/* DANE PSA */}
        <View style={styles.petInfo}>
          <Text style={[styles.petName, { color: currentColors.text }]}>{pet.name}</Text>
          <Text style={[styles.petDescription, { color: theme === 'dark' ? '#A0A0A0' : '#777' }]}>
            {collarNames[pet.collar] || 'No collar assigned'}
          </Text>
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

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 15,
    zIndex: 999,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
  },
  singlePaw: {
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
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 42,
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
  },
  petInfo: {
    alignItems: 'center',
    marginBottom: 30,
  },
  petName: {
    fontSize: 36,
  },
  petDescription: {
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
    fontWeight: '600',
  },
  // Zunifikowane wymiary przycisków bocznych (40x40) dla zachowania idealnego wycentrowania logo
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
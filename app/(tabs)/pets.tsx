import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';
import { auth } from '../../firebaseConfig';

import { getPetsByUser, Pet } from '../../services/petService';

const ITEM_SIZE = 290;

export default function MyPetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const currentUserId = auth.currentUser ? auth.currentUser.uid : null;
  console.log("ID obecnego użytkownika to:", currentUserId);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      if (Platform.OS !== 'web' || typeof window !== 'undefined') {
        const fetchUserPets = async () => {
          try {
            setLoading(true);
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

        <Text style={[styles.pageTitle, { color: currentColors.text }]}>Moje zwierzaki</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={currentColors.tint} />
          </View>
        ) : (
          <View style={styles.grid}>

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
                      style={[styles.petImage, { borderColor: currentColors.border, backgroundColor: currentColors.border }]}
                      // @ts-ignore
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.warn(`Problem z załadowaniem obrazka dla ${pet.name}:`, e.nativeEvent.error);
                      }}
                    />
                  </TouchableOpacity>
                  <ThemedText style={[styles.petName, { color: currentColors.text }]}>{pet.name}</ThemedText>
                </View>
              );
            })}

            <View style={styles.gridItem}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme === 'dark' ? '#26292B' : '#E8E8E8' }]}
                onPress={() => router.push('/add_pet')}
              >
                <Ionicons name="add" size={50} color={currentColors.icon} />
              </TouchableOpacity>
              <ThemedText style={[styles.petName, { color: currentColors.text }]}>Dodaj</ThemedText>
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
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 30,
    marginBottom: 40,
    textAlign: 'center',
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
  },
  headerSide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  }
});
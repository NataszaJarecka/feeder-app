import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';
import { auth, db } from '../../firebaseConfig';
import { getAllCollars } from '../../services/collarService';
import { addPet } from '../../services/petService';

const { width } = Dimensions.get('window');

// Słownik mapujący czyste angielskie nazwy kolorów na polskie etykiety i kolory HEX
const colorMap: Record<string, { label: string; hex: string }> = {
  blue: { label: 'Niebieska obroża', hex: '#5FB4FF' },
  orange: { label: 'Pomarańczowa obroża', hex: '#E99664' },
  red: { label: 'Czerwona obroża', hex: '#FF5F5F' },
  green: { label: 'Zielona obroża', hex: '#5FFF7D' },
};

// Funkcja zabezpieczająca: czyści tekst z bazy (np. "red collar" -> "red") i mapuje na j. polski
const getCollarDetails = (colorName: string) => {
  // Zamieniamy na małe litery i usuwamy ewentualne słowo "collar", jeśli zapisano je w bazie
  const cleanColor = colorName.toLowerCase().replace('collar', '').trim();

  return colorMap[cleanColor] || { label: `${colorName} obroża`, hex: '#888888' };
};

interface AvailableCollar {
  id: string;
  colorName: string;
  label: string;
  hex: string;
}

const AddPetScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [name, setName] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [collarOptions, setCollarOptions] = useState<AvailableCollar[]>([]);
  const [selectedCollar, setSelectedCollar] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCollars, setIsFetchingCollars] = useState(true);

  const fetchAvailableCollars = useCallback(async () => {
    try {
      setIsFetchingCollars(true);
      const allCollars = await getAllCollars();
      const petsSnapshot = await getDocs(collection(db, 'pets'));
      const occupiedCollarColors = new Set<string>();

      petsSnapshot.forEach((doc) => {
        const petData = doc.data();
        if (petData.collar) {
          occupiedCollarColors.add(petData.collar.toLowerCase().trim());
        }
      });

      const available = allCollars
        .filter(collar => !occupiedCollarColors.has(collar.colour.toLowerCase().trim()))
        .map(collar => {
          const details = getCollarDetails(collar.colour);
          return {
            id: collar.colour, // Zapisujemy oryginalną wartość do bazy (np. "red" lub "red collar")
            colorName: collar.colour,
            label: details.label, // Tutaj trafia polska nazwa z mapowania
            hex: details.hex,
          };
        });

      setCollarOptions(available);

      if (available.length > 0) {
        setSelectedCollar(available[0].id);
      } else {
        setSelectedCollar('');
      }
    } catch (err) {
      console.error("Błąd ładowania obroży:", err);
      setError('Nie udało się załadować dostępnych obroży.');
    } finally {
      setIsFetchingCollars(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAvailableCollars();
    }, [fetchAvailableCollars])
  );

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Wymagany dostęp do galerii zdjęć!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];

      const imageFile = {
        uri: asset.uri,
        name: asset.fileName || `pet_photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };

      setSelectedPhoto(imageFile);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Proszę wprowadzić imię zwierzaka');
      return;
    }

    if (!selectedPhoto) {
      setError('Proszę wybrać zdjęcie zwierzaka');
      return;
    }

    if (!selectedCollar) {
      setError('Brak wolnych obroży do przypisania');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const petData = {
        name: name.trim(),
        collar: selectedCollar,
        userId: auth.currentUser?.uid || null,
      };

      await addPet(petData, selectedPhoto);

      setName('');
      setSelectedPhoto(null);
      setSelectedCollar('');

      router.replace({
        pathname: '/pets',
        params: { refresh: Date.now().toString() }
      });
    } catch (err) {
      console.error(err);
      setError('Coś poszło nie tak podczas zapisywania. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: currentColors.background }]}>

      <View style={[
        styles.header,
        {
          paddingTop: insets.top + 15,
          backgroundColor: currentTheme === 'dark' ? '#1E2123' : '#FFFFFF',
          shadowColor: currentTheme === 'dark' ? '#FFFFFF' : '#000000',
          shadowOpacity: currentTheme === 'dark' ? 0.35 : 0.12,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: currentTheme === 'dark' ? 5 : 4,
          elevation: currentTheme === 'dark' ? 10 : 4,
        }
      ]}>
        <TouchableOpacity onPress={() => router.replace('/pets')} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={28} color={currentColors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        <Text style={[styles.title, { color: currentColors.text }]}>Dodaj zwierzaka</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Imię</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Wprowadź imię zwierzaka"
              placeholderTextColor={currentTheme === 'dark' ? '#7A7A7A' : '#999'}
              style={[styles.input, { backgroundColor: currentTheme === 'dark' ? '#26292B' : '#F8F8F8', color: currentColors.text }]}
              editable={!isLoading}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Wybierz zdjęcie</Text>

            {selectedPhoto && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={[styles.imagePreview, { borderColor: currentColors.border, backgroundColor: currentColors.border }]}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.galleryButton}
              activeOpacity={0.8}
              onPress={pickImage}
              disabled={isLoading}
            >
              <Ionicons name="images" size={18} color="#FFFFFF" />
              <Text style={styles.galleryButtonText}>
                {selectedPhoto ? 'Zmień zdjęcie' : 'Wybierz z galerii'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Wybierz obrożę</Text>

            {isFetchingCollars ? (
              <ActivityIndicator color={currentColors.text} style={{ marginVertical: 10 }} />
            ) : collarOptions.length === 0 ? (
              <Text style={[styles.emptyCollarsText, { color: currentTheme === 'dark' ? '#AAA' : '#666' }]}>
                Brak wolnych obroży do przypisania.
              </Text>
            ) : (
              collarOptions.map((collar) => {
                const active = selectedCollar === collar.id;
                return (
                  <TouchableOpacity
                    key={collar.id}
                    style={[
                      styles.radioRow,
                      { borderColor: currentTheme === 'dark' ? '#444' : '#DDD' },
                      active && (currentTheme === 'dark' ? { borderColor: collar.hex, backgroundColor: '#2D231E' } : { borderColor: collar.hex, backgroundColor: `${collar.hex}15` })
                    ]}
                    onPress={() => setSelectedCollar(collar.id)}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    <View style={[styles.radioCircle, { borderColor: active ? collar.hex : (currentTheme === 'dark' ? '#666' : '#CCC') }]}>
                      {active && <View style={[styles.radioDot, { backgroundColor: collar.hex }]} />}
                    </View>
                    {/* Wyświetla w 100% poprawnie zmapowaną polską nazwę obroży */}
                    <Text style={[styles.radioLabel, { color: currentColors.text }, active && { color: collar.hex }]}>
                      {collar.label}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveButton, (isLoading || collarOptions.length === 0) && styles.disabledButton]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isLoading || collarOptions.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Zapisz</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'visible' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, paddingHorizontal: 20, zIndex: 999 },
  headerSide: { width: 40, height: 40, justifyContent: 'center' },
  logo: { fontSize: 32, fontWeight: 'bold', fontStyle: 'italic', flex: 1, textAlign: 'center' },
  scrollContent: { alignItems: 'center', paddingTop: 20, paddingBottom: 80 },
  title: { fontSize: 42, fontWeight: '400', marginTop: 30, marginBottom: 25, textAlign: 'center' },
  form: { width: '100%', maxWidth: width * 0.85 },
  inputGroup: { marginBottom: 20 },
  input: { width: '100%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  section: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, marginBottom: 14, fontWeight: '600' },
  imagePreviewContainer: { alignItems: 'center', marginBottom: 15 },
  imagePreview: { width: 150, height: 150, borderRadius: 75, borderWidth: 1 },
  galleryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 25, backgroundColor: '#E99664', gap: 10 },
  galleryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12 },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  radioDot: { width: 12, height: 12, borderRadius: 6 },
  radioLabel: { fontSize: 16 },
  errorText: { color: '#D94747', marginBottom: 14, textAlign: 'center' },
  saveButton: { backgroundColor: '#E99664', paddingVertical: 16, borderRadius: 25, alignItems: 'center' },
  disabledButton: { backgroundColor: '#F3C5A5' },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  bgPaw: { position: 'absolute', width: 200, height: 200, opacity: 0.6, zIndex: -1 },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  emptyCollarsText: { fontSize: 15, textAlign: 'center', marginVertical: 10, fontStyle: 'italic' }
});

export default AddPetScreen;
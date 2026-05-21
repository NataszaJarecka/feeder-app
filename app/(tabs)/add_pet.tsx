import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; // Importujemy picker od Expo
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { auth } from '../../firebaseConfig'; // dostosuj ścieżkę
import { addPet } from '../../services/petService';


const { width } = Dimensions.get('window');

const collarOptions = [
  { id: 'blue', label: 'Blue collar', color: '#5FB4FF' },
  { id: 'orange', label: 'Orange collar', color: '#E99664' },
  { id: 'green', label: 'Green collar', color: '#66B96A' },
];

const AddPetScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');

  // ZMIANA: Zamiast boolean, przechowujemy tutaj uri wybranego pliku lub obiekt File
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  const [selectedCollar, setSelectedCollar] = useState(collarOptions[0].id);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Funkcja otwierająca galerię telefonu
  const pickImage = async () => {
    // Prośba o uprawnienia do galerii
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Interesują nas tylko zdjęcia
      allowsEditing: true,    // Pozwala użytkownikowi przyciąć zdjęcie (np. w kwadrat)
      aspect: [1, 1],
      quality: 0.8,           // Kompresja, by zdjęcia nie ważyły po 10MB
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];

      // W React Native, aby przesłać plik przez FormData jako "File", tworzymy taki obiekt:
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
      setError('Please enter a pet name');
      return;
    }

    if (!selectedPhoto) {
      setError('Please select a photo for your pet');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Przygotowujemy dane TEKSTOWE zwierzaka (zgodnie z Omit<NewPet, 'image'> z petService)
      const petData = {
        name: name.trim(),
        collar: selectedCollar,
        userId: auth.currentUser?.uid || null, // Tutaj docelowo wstawisz ID zalogowanego usera z Firebase Auth
      };

      // Wywołujemy naszą zmodyfikowaną funkcję.
      // JavaScript w React Native potrafi przepchnąć obiekt z uri, name i type do fetch/axios w Supabase.
      await addPet(petData, selectedPhoto);

      // Po sukcesie wracamy do listy zwierzaków
      router.replace('/pets');
    } catch (err) {
      console.error(err);
      setError('Something went wrong while saving. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={() => router.push('/pets')} style={styles.headerSideLeft}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Add pet</ThemedText>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Pet name</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your pet's name"
              placeholderTextColor="#999"
              style={styles.input}
              editable={!isLoading}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Choose photo</ThemedText>

            {/* Podgląd wybranego zdjęcia */}
            {selectedPhoto && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.imagePreview} />
              </View>
            )}

            <TouchableOpacity
              style={styles.galleryButton}
              activeOpacity={0.8}
              onPress={pickImage} // Podpinamy funkcję wyboru zdjęcia
              disabled={isLoading}
            >
              <Ionicons name="images" size={18} color="#FFFFFF" />
              <Text style={styles.galleryButtonText}>
                {selectedPhoto ? 'Change photo' : 'Choose from gallery'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Choose collar</ThemedText>
            {collarOptions.map((collar) => {
              const active = selectedCollar === collar.id;
              return (
                <TouchableOpacity
                  key={collar.id}
                  style={[styles.radioRow, active && styles.radioRowActive]}
                  onPress={() => setSelectedCollar(collar.id)}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <View style={[styles.radioCircle, { borderColor: active ? collar.color : '#CCC' }]}>
                    {active && <View style={[styles.radioDot, { backgroundColor: collar.color }]} />}
                  </View>
                  <Text style={[styles.radioLabel, active && { color: collar.color }]}>{collar.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save pet</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  headerSide: {
    width: 32,
    alignItems: 'flex-end',
  },
  headerSideLeft: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 30,
    marginBottom: 25,
    color: '#000',
  },
  form: {
    width: '100%',
    maxWidth: width * 0.85,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 14,
    fontWeight: '600',
    color: '#000',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75, // Tworzy okrągły podgląd zdjęcia zwierzaka
    backgroundColor: '#F0F0F0',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: '#E99664',
    gap: 10,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 12,
  },
  radioRowActive: {
    borderColor: '#E99664',
    backgroundColor: '#FFF3EA',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 16,
    color: '#000',
  },
  errorText: {
    color: '#D94747',
    marginBottom: 14,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#E99664',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#F3C5A5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddPetScreen;
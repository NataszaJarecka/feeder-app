import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { deletePetWithMeals, getPetById, updatePet } from '../../services/petService';

const { width } = Dimensions.get('window');

const collarOptions = [
  { id: 'blue', label: 'Blue collar', color: '#5FB4FF' },
  { id: 'orange', label: 'Orange collar', color: '#E99664' },
  { id: 'green', label: 'Green collar', color: '#66B96A' },
];

const EditPetScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ZABEZPIECZENIE: Pobieramy parametry na dwa sposoby, na wypadek gdyby lokalny search params był pusty
  const localParams = useLocalSearchParams<{ petId: string }>();
  const globalParams = useGlobalSearchParams<{ petId: string }>();
  const petId = localParams.petId || globalParams.petId;

  const [name, setName] = useState('');
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState('');
  const [newSelectedPhoto, setNewSelectedPhoto] = useState<any>(null);
  const [selectedCollar, setSelectedCollar] = useState(collarOptions[0].id);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPetData = async () => {
      // Logujemy, żeby sprawdzić w terminalu, czy ID w ogóle dotarło do tego ekranu
      console.log("=== START ŁADOWANIA EDYCJI ===");
      console.log("Odebrane petId:", petId);

      if (!petId) {
        console.warn("Brak petId! Kółko będzie się kręcić bez końca.");
        setError('Missing pet identifier');
        setIsLoadingData(false);
        return;
      }

      try {
        const petData = await getPetById(petId);
        console.log("Pobrane dane z serwisu:", petData);

        if (petData) {
          setName(petData.name || '');
          setCurrentPhotoUrl(petData.image || '');
          setSelectedCollar(petData.collar || collarOptions[0].id);
        } else {
          console.log("Serwis zwrócił null dla ID:", petId);
          setError('Pet not found in database');
        }
      } catch (err) {
        console.error("Krytyczny błąd w useEffect przy getPetById:", err);
        setError('Failed to load pet data');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchPetData();
  }, [petId]);

  // Wybór nowego zdjęcia z galerii
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
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
        name: asset.fileName || `updated_pet_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };
      setNewSelectedPhoto(imageFile);
    }
  };

  // Aktualizacja danych
  const handleUpdate = async () => {
    if (!name.trim()) {
      setError('Please enter a pet name');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const updatedFields = {
        name: name.trim(),
        collar: selectedCollar,
        userId: '1',
      };

      await updatePet(petId!, updatedFields, newSelectedPhoto || undefined);
      router.dismissAll();
      router.replace('/pets');
    } catch (err) {
      console.error(err);
      setError('Something went wrong while updating. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Usunięcie zwierzaka
  const handleDelete = () => {
    Alert.alert(
      "Delete Pet",
      `Are you sure you want to permanently delete ${name || 'this pet'}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSaving(true);
              await deletePetWithMeals(petId!);
              router.dismissAll();
              router.replace('/pets');
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Could not delete pet. Please try again.");
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  // Jeśli jest błąd, pokazujemy go zamiast kręcącego się kółka
  if (error) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle-outline" size={50} color="#D94747" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (isLoadingData) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#E99664" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerSideLeft}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </TouchableOpacity>
        <ThemedText style={styles.logo}>Edit Profile</ThemedText>
        {/* Pusty element dla zachowania symetrii i idealnego wyśrodkowania tytułu */}
        <View style={styles.headerSideRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>

          <View style={styles.imageSection}>
            <View style={styles.imagePreviewContainer}>
              <Image
                source={
                  newSelectedPhoto
                    ? { uri: newSelectedPhoto.uri }
                    : currentPhotoUrl
                      ? { uri: currentPhotoUrl }
                      : require('@/assets/images/dog_placeholder.png')
                }
                style={styles.imagePreview}
                // @ts-ignore
                crossOrigin="anonymous"
              />
            </View>

            <TouchableOpacity style={styles.galleryButton} activeOpacity={0.8} onPress={pickImage} disabled={isSaving}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
              <Text style={styles.galleryButtonText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Pet name</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter pet's name"
              placeholderTextColor="#999"
              style={styles.input}
              editable={!isSaving}
            />
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
                  disabled={isSaving}
                >
                  <View style={[styles.radioCircle, { borderColor: active ? collar.color : '#CCC' }]}>
                    {active && <View style={[styles.radioDot, { backgroundColor: collar.color }]} />}
                  </View>
                  <Text style={[styles.radioLabel, active && { color: collar.color }]}>{collar.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* PRZYCISK ZAPISU */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleUpdate}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
          </TouchableOpacity>

          {/* DUŻY CZERWONY PRZYCISK USUWANIA */}
          <TouchableOpacity
            style={[styles.deleteButton, isSaving && styles.disabledButton]}
            onPress={handleDelete}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.deleteButtonText}>Delete Pet</Text>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  headerSideLeft: {
    width: 50,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerSideRight: {
    width: 50,
    height: 40,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 80,
  },
  form: {
    width: '100%',
    maxWidth: width * 0.85,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imagePreviewContainer: {
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  imagePreview: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: '#E99664',
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#E99664',
    gap: 8,
  },
  galleryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#E99664',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#F3C5A5',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: '#D94747',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#E99664',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  }
});

export default EditPetScreen;
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';
import { auth } from '../../firebaseConfig';
import { deletePetWithMeals, getPetById, updatePet } from '../../services/petService';

const { width } = Dimensions.get('window');

const collarOptions = [
  { id: 'blue', label: 'Niebieska obroża', color: '#5FB4FF' },
  { id: 'orange', label: 'Pomarańczowa obroża', color: '#E99664' },
];

const EditPetScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

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
        name: asset.fileName || `updated_pet_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };
      setNewSelectedPhoto(imageFile);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError('Proszę wprowadzić imię zwierzaka!');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const updatedFields = {
        name: name.trim(),
        collar: selectedCollar,
        userId: auth.currentUser?.uid || null,
      };

      await updatePet(petId!, updatedFields, newSelectedPhoto || undefined);
      router.dismissAll();
      router.replace('/pets');
    } catch (err) {
      console.error(err);
      setError('Coś poszło nie tak podczas aktualizowania danych. Spróbuj ponownie później.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Usuń zwierzaka",
      `Czy na pewno chcesz usunąć zwierzaka ${name || ''}?`,
      [
        { text: "Cofnij", style: "cancel" },
        {
          text: "Usuń",
          style: "destructive",
          onPress: async () => {
            try {
              setIsSaving(true);
              await deletePetWithMeals(petId!);
              router.dismissAll();
              router.replace('/pets');
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "Błąd podczas usuwania zwierzaka. Spróbuj jeszcze raz.");
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  if (error) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: currentColors.background }, styles.center]}>
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
      <ThemedView style={[styles.container, { backgroundColor: currentColors.background }, styles.center]}>
        <ActivityIndicator size="large" color={currentColors.tint} />
      </ThemedView>
    );
  }

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
        <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={28} color={currentColors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>

        <TouchableOpacity onPress={() => router.push('/notification')} style={[styles.headerSide, { alignItems: 'flex-end' }]}>
          <Ionicons name="notifications" size={28} color={currentColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        <Text style={[styles.pageTitle, { color: currentColors.text }]}>Edytuj zwierzaka</Text>

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
                style={[styles.imagePreview, { borderColor: currentColors.border }]}
                // @ts-ignore
                crossOrigin="anonymous"
              />
            </View>

            <TouchableOpacity style={styles.galleryButton} activeOpacity={0.8} onPress={pickImage} disabled={isSaving}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
              <Text style={styles.galleryButtonText}>Zmień zdjęcie</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Imię</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Wprowadź imię zwierzaka"
              placeholderTextColor={theme === 'dark' ? '#7A7A7A' : '#999'}
              style={[styles.input, { backgroundColor: theme === 'dark' ? '#26292B' : '#F8F8F8', color: currentColors.text }]}
              editable={!isSaving}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Wybierz obrożę</ThemedText>
            {collarOptions.map((collar) => {
              const active = selectedCollar === collar.id;
              return (
                <TouchableOpacity
                  key={collar.id}
                  style={[
                    styles.radioRow,
                    { borderColor: theme === 'dark' ? '#444' : '#DDD' },
                    active && (theme === 'dark' ? { borderColor: '#E99664', backgroundColor: '#2D231E' } : styles.radioRowActive)
                  ]}
                  onPress={() => setSelectedCollar(collar.id)}
                  activeOpacity={0.8}
                  disabled={isSaving}
                >
                  <View style={[styles.radioCircle, { borderColor: active ? collar.color : (theme === 'dark' ? '#666' : '#CCC') }]}>
                    {active && <View style={[styles.radioDot, { backgroundColor: collar.color }]} />}
                  </View>
                  <Text style={[styles.radioLabel, { color: currentColors.text }, active && { color: collar.color }]}>{collar.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            onPress={handleUpdate}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Zapisz zmiany</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, isSaving && styles.disabledButton]}
            onPress={handleDelete}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.deleteButtonText}>Usuń zwierzaka</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'visible',
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
    zIndex: 999,
  },
  headerSide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
  pageTitle: {
    fontSize: 42,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 15,
    fontWeight: '400',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 80,
  },
  form: {
    width: '100%',
    maxWidth: width * 0.85,
    marginTop: 15,
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
    fontWeight: '500',
  },
  input: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 14,
    fontWeight: '600',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
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
});

export default EditPetScreen;
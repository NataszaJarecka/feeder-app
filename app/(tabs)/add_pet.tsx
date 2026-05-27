import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext'; // <-- ZMIANA: Importujemy Twój kontekst motywu
import { auth } from '../../firebaseConfig';
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

  // ZMIANA: Pobieramy zapisany w aplikacji motyw (light/dark) z Twojego kontekstu
  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];

  const [name, setName] = React.useState('');
  const [selectedPhoto, setSelectedPhoto] = React.useState<any>(null);
  const [selectedCollar, setSelectedCollar] = React.useState(collarOptions[0].id);
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

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
      const petData = {
        name: name.trim(),
        collar: selectedCollar,
        userId: auth.currentUser?.uid || null,
      };

      await addPet(petData, selectedPhoto);
      router.replace('/pets');
    } catch (err) {
      console.error(err);
      setError('Something went wrong while saving. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: currentColors.background }]}>

      {/* HEADER Z DYNAMICZNYMI KOLORAMI I CIENIEM */}
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
        <Text style={[styles.title, { color: currentColors.text }]}>Add pet</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Pet name</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your pet's name"
              placeholderTextColor={currentTheme === 'dark' ? '#7A7A7A' : '#999'}
              style={[styles.input, { backgroundColor: currentTheme === 'dark' ? '#26292B' : '#F8F8F8', color: currentColors.text }]}
              editable={!isLoading}
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Choose photo</ThemedText>

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
                  style={[
                    styles.radioRow,
                    { borderColor: currentTheme === 'dark' ? '#444' : '#DDD' },
                    active && (currentTheme === 'dark' ? { borderColor: '#E99664', backgroundColor: '#2D231E' } : styles.radioRowActive)
                  ]}
                  onPress={() => setSelectedCollar(collar.id)}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <View style={[styles.radioCircle, { borderColor: active ? collar.color : (currentTheme === 'dark' ? '#666' : '#CCC') }]}>
                    {active && <View style={[styles.radioDot, { backgroundColor: collar.color }]} />}
                  </View>
                  <Text style={[styles.radioLabel, { color: currentColors.text }, active && { color: collar.color }]}>{collar.label}</Text>
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
  headerSide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
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
    paddingTop: 20,
    paddingBottom: 80,
  },
  title: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 30,
    marginBottom: 25,
    textAlign: 'center',
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
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
// 1. Zaimportuj funkcję addPet ze swojego pliku z serwisami (zmień ścieżkę na poprawną!)
import { addPet } from '../../services/petService';

const { width } = Dimensions.get('window');

const collarOptions = [
  { id: 'blue', label: 'Blue collar', color: '#5FB4FF' },
  { id: 'orange', label: 'Orange collar', color: '#E99664' },
  { id: 'green', label: 'Green collar', color: '#66B96A' },
];

const AddPetScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [photoChosen, setPhotoChosen] = useState(false);
  const [selectedCollar, setSelectedCollar] = useState(collarOptions[0].id);
  const [error, setError] = useState('');
  // 2. Dodajemy stan ładowania, aby zablokować przycisk podczas zapisu
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a pet name');
      return;
    }

    setError('');
    setIsLoading(true); // Włączamy kręciołek ładowania

    try {
      // 3. Przygotowujemy dane do wysłania.
      // UWAGA: userId powinien pochodzić z Twojego modułu autentykacji (np. Firebase Auth).
      // Na potrzeby testów wklejam tu przykładowy ID użytkownika.
      const petData = {
        name: name.trim(),
        collar: selectedCollar,
        image: photoChosen ? 'https://example.com/placeholder-pet.jpg' : '',
        userId: '1',
      };

      // 4. Wywołujemy funkcję zapisującą do Firestore
      await addPet(petData);

      // Po sukcesie wracamy do poprzedniego ekranu
      router.back();
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false); // Wyłączamy ładowanie niezależnie od wyniku
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
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
              editable={!isLoading} // Blokujemy wpisywanie podczas ładowania
            />
          </View>

          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Choose photo</ThemedText>
            <TouchableOpacity
              style={styles.galleryButton}
              activeOpacity={0.8}
              onPress={() => setPhotoChosen(!photoChosen)} // Prosta zmiana stanu dla testu
              disabled={isLoading}
            >
              <Ionicons name="images" size={18} color="#FFFFFF" />
              <Text style={styles.galleryButtonText}>{photoChosen ? 'Change photo' : 'Choose from gallery'}</Text>
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
                  disabled={isLoading} // Blokujemy możliwość klikania podczas zapisu
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

          {/* Zmieniamy przycisk tak, aby reagował na stan isLoading */}
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
    paddingTop: 50,
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
  photoLabel: {
    marginTop: 10,
    fontSize: 14,
    color: '#687076',
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
    backgroundColor: '#F3C5A5', // Jaśniejszy kolor sygnalizujący zablokowanie przycisku
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddPetScreen;
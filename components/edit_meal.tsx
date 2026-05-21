import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../firebaseConfig'; // <-- DODANY IMPORT
import { ThemedText } from './themed-text';

// IMPORT SERWISÓW I TYPÓW
import { Timestamp } from 'firebase/firestore';
import { deleteMeal, Meal, updateMeal } from '../services/feedingService';
import { getPetsByUser, Pet } from '../services/petService';

interface EditMealModalProps {
  isVisible: boolean;
  onClose: () => void;
  meal: Meal | null; // Przekazujemy aktualnie wybrany posiłek do edycji
}

export function EditMealModal({ isVisible, onClose, meal }: EditMealModalProps) {
  // Stany dla dynamicznych zwierzaków z bazy
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [loadingPets, setLoadingPets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'date' | 'time' | null>(null);
  const [portion, setPortion] = useState('50');

  const currentUserId = auth.currentUser?.uid || null;

  // 1. Pobieranie zwierzaków użytkownika przy otwarciu modala
  useEffect(() => {
    if (isVisible) {
      const fetchPets = async () => {
        setLoadingPets(true);
        try {
          const fetchedPets = await getPetsByUser(currentUserId);
          setPets(fetchedPets);
        } catch (error) {
          console.error("Błąd podczas pobierania zwierzaków w modalu edycji:", error);
        } finally {
          setLoadingPets(false);
        }
      };
      fetchPets();
    }
  }, [isVisible]);

  // 2. Ładowanie istniejących danych posiłku do stanów formularza
  useEffect(() => {
    if (isVisible && meal) {
      setSelectedPet(meal.petId);
      setPortion(meal.portionGrams.toString());

      const mealDate = meal.timestamp && typeof meal.timestamp.toDate === 'function'
        ? meal.timestamp.toDate()
        : new Date(meal.timestamp);
      setDate(mealDate);
    }
  }, [isVisible, meal]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // ZAPIS ZMIAN (UPDATE)
  const handleSave = async () => {
    if (!meal) return;
    if (!selectedPet) {
      console.log("Nie wybrano żadnego zwierzaka");
      return;
    }

    setIsSaving(true);
    try {
      const updatedMealData: Partial<Meal> = {
        petId: selectedPet,
        timestamp: Timestamp.fromDate(date),
        portionGrams: parseFloat(portion) || 0,
      };

      await updateMeal(meal.id, updatedMealData);
      console.log("Pomyślnie zaktualizowano posiłek!");
      onClose();
    } catch (error) {
      console.error("Błąd aktualizacji posiłku:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // USUWANIE POSIŁKU (DELETE)
  const handleDelete = async () => {
    if (!meal) return;

    const performDelete = async () => {
      setIsDeleting(true);
      try {
        await deleteMeal(meal.id);
        console.log("Pomyślnie usunięto posiłek!");
        onClose();
      } catch (error) {
        console.error("Błąd usuwania posiłku:", error);
      } finally {
        setIsDeleting(false);
      }
    };

    // Obsługa potwierdzenia usuwania (Wersja WEB vs MOBILE)
    if (Platform.OS === 'web') {
      if (window.confirm("Are you sure you want to delete this meal?")) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Delete Meal",
        "Are you sure you want to delete this scheduled meal?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };

  // Funkcje pomocnicze dla wersji WEB
  const handleWebDateChange = (e: any) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(date);
    newDate.setFullYear(year, month - 1, day);
    setDate(newDate);
  };

  const handleWebTimeChange = (e: any) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes);
    setDate(newDate);
  };

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.modalTitle} type="title">Edit Meal</ThemedText>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* PETS */}
            <ThemedText style={styles.label}>Pet</ThemedText>

            {loadingPets ? (
              <ActivityIndicator size="small" color="#F4A261" style={{ marginVertical: 10 }} />
            ) : pets.length === 0 ? (
              <ThemedText style={styles.radioLabel}>No pets found.</ThemedText>
            ) : (
              pets.map(pet => (
                <TouchableOpacity key={pet.id} style={styles.radioRow} onPress={() => setSelectedPet(pet.id)}>
                  <Ionicons
                    name={selectedPet === pet.id ? "radio-button-on" : "radio-button-off"}
                    size={24} color="black"
                  />
                  <ThemedText style={styles.radioLabel}>{pet.name}</ThemedText>
                </TouchableOpacity>
              ))
            )}

            {/* TIME */}
            <ThemedText style={styles.label}>Time</ThemedText>
            <View style={styles.dateTimeContainer}>
              {Platform.OS === 'web' ? (
                <>
                  <input
                    type="date"
                    onChange={handleWebDateChange}
                    style={webInputStyle}
                    value={date.toISOString().split('T')[0]}
                  />
                  <input
                    type="time"
                    onChange={handleWebTimeChange}
                    style={webInputStyle}
                    value={date.toTimeString().slice(0, 5)}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.orangeInputSmall} onPress={() => setShowPicker('date')}>
                    <ThemedText style={styles.whiteText}>
                      {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.orangeInputSmall} onPress={() => setShowPicker('time')}>
                    <ThemedText style={styles.whiteText}>
                      {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* PORTION */}
            <ThemedText style={styles.label}>Portion</ThemedText>
            <View style={styles.orangeInput}>
              <View style={styles.row}>
                <TextInput
                  style={styles.textInput}
                  value={portion}
                  onChangeText={setPortion}
                  keyboardType="numeric"
                  placeholderTextColor="#ddd"
                  editable={!isSaving && !isDeleting}
                />
                <ThemedText style={styles.whiteText}>g</ThemedText>
              </View>
            </View>
          </ScrollView>

          {/* KONTENER PRZYCISKÓW AKCJI */}
          <View style={styles.actionsContainer}>
            {/* PRZYCISK USUWANIA (DELETE) */}
            <TouchableOpacity
              style={[styles.deleteButton, isDeleting && { backgroundColor: '#fcc7c7' }]}
              onPress={handleDelete}
              disabled={isSaving || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.deleteText}>Delete</ThemedText>
              )}
            </TouchableOpacity>

            {/* PRZYCISK ZAPISU (DONE) */}
            <TouchableOpacity
              style={[styles.doneButton, isSaving && { backgroundColor: '#fcd2b1' }]}
              onPress={handleSave}
              disabled={isSaving || isDeleting}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.doneText}>Save</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* MOBILE PICKER ONLY */}
      {showPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={date}
          mode={showPicker}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
    </Modal>
  );
}

const webInputStyle: any = {
  backgroundColor: '#F4A261',
  border: 'none',
  borderRadius: '20px',
  color: 'white',
  padding: '14px',
  fontSize: '18px',
  fontWeight: '500',
  flex: 1,
  textAlign: 'center',
  cursor: 'pointer',
  fontFamily: 'sans-serif',
  outline: 'none',
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '88%',
    backgroundColor: 'white',
    borderRadius: 35,
    padding: 25,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 32, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 22, marginTop: 15, marginBottom: 8, fontWeight: '500' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  radioLabel: { fontSize: 18, marginLeft: 10 },
  dateTimeContainer: { flexDirection: 'row', gap: 10, width: '100%' },
  orangeInput: {
    backgroundColor: '#F4A261',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orangeInputSmall: {
    backgroundColor: '#F4A261',
    borderRadius: 20,
    padding: 14,
    flex: 1,
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  whiteText: { color: 'white', fontSize: 18, fontWeight: '500' },
  textInput: { color: 'white', fontSize: 18, fontWeight: '500', textAlign: 'center', minWidth: 40 },

  // UKŁAD PRZYCISKÓW NA DOLE Modala
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 25,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#E76F51', // Czerwony/Ceglasty odcień pasujący do palety F4A261
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  doneButton: {
    flex: 1,
    backgroundColor: '#F4A261',
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
});
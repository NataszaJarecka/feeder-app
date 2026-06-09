import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';

// IMPORT SERWISÓW I TYPÓW
import { Timestamp } from 'firebase/firestore';
import { Colors } from '../constants/Colors';
import { useAppTheme } from '../context/ThemeContext';
import { auth } from '../firebaseConfig';
import { addMeal, NewMeal, RecurrenceType } from '../services/feedingService';
import { getPetsByUser, Pet } from '../services/petService';

interface AddMealModalProps {
  isVisible: boolean;
  onClose: () => void;
}

// Struktura wielkości porcji (gramy ukryte przed użytkownikiem)
const PORTION_OPTIONS = [
  { id: 'SMALL', label: 'Mała', grams: 25 },
  { id: 'MEDIUM', label: 'Średnia', grams: 65 },
  { id: 'LARGE', label: 'Duża', grams: 100 },
];

export function AddMealModal({ isVisible, onClose }: AddMealModalProps) {
  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState('');
  const [loadingPets, setLoadingPets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'date' | 'time' | 'endDate' | null>(null);

  // Stan przechowujący wybrane ID rozmiaru (domyślnie 'MEDIUM' / Średnia)
  const [selectedPortionId, setSelectedPortionId] = useState('MEDIUM');

  const [recurrence, setRecurrence] = useState<RecurrenceType>('ONCE');
  const [endDate, setEndDate] = useState(new Date());

  const currentUserId = auth.currentUser?.uid || null;

  useEffect(() => {
    if (isVisible) {
      const fetchPets = async () => {
        setLoadingPets(true);
        try {
          const fetchedPets = await getPetsByUser(currentUserId);
          setPets(fetchedPets);
          if (fetchedPets.length > 0) {
            setSelectedPet(fetchedPets[0].id);
          }
        } catch (error) {
          console.error("Błąd podczas pobierania zwierzaków w modalu:", error);
        } finally {
          setLoadingPets(false);
        }
      };
      fetchPets();

      setRecurrence('ONCE');
      setSelectedPortionId('MEDIUM'); // Resetujemy do Średniej przy otwarciu
      const defaultEndDate = new Date();
      defaultEndDate.setDate(defaultEndDate.getDate() + 7);
      setEndDate(defaultEndDate);
    }
  }, [isVisible]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
    if (selectedDate) {
      if (showPicker === 'endDate') {
        setEndDate(selectedDate);
      } else {
        setDate(selectedDate);
      }
    }
  };

  const handleSave = async () => {
    if (!selectedPet) {
      console.log("Nie wybrano żadnego zwierzaka");
      return;
    }

    setIsSaving(true);
    try {
      const finalizedEndDate = new Date(endDate);
      finalizedEndDate.setHours(23, 59, 59, 999);

      // Znajdujemy gramaturę przypisaną do wybranego ID
      const selectedPortion = PORTION_OPTIONS.find(p => p.id === selectedPortionId);
      const portionGrams = selectedPortion ? selectedPortion.grams : 65;

      const newMealData: NewMeal = {
        petId: selectedPet,
        timestamp: Timestamp.fromDate(date),
        portionGrams: portionGrams, // Zapisujemy odpowiednio 25, 65 lub 100 do bazy
        status: 'scheduled',
        recurrence: recurrence,
        endDate: recurrence !== 'ONCE' ? Math.floor(finalizedEndDate.getTime() / 1000) : null
      };

      await addMeal(newMealData);
      console.log("Pomyślnie zapisano posiłek/serię posiłków w bazie!");
      onClose();
    } catch (error) {
      console.error("Błąd zapisu posiłku do bazy:", error);
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleWebEndDateChange = (e: any) => {
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(endDate);
    newDate.setFullYear(year, month - 1, day);
    setEndDate(newDate);
  };

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

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#1E2123' : 'white' }]}>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={isSaving}>
            <Ionicons name="close" size={28} color={theme === 'dark' ? '#A0A0A0' : '#666'} />
          </TouchableOpacity>

          <ThemedText style={[styles.modalTitle, { color: currentColors.text }]} type="title">Dodaj posiłek</ThemedText>

          <ScrollView showsVerticalScrollIndicator={false}>
            <ThemedText style={[styles.label, { color: currentColors.text }]}>Zwierzak</ThemedText>

            {loadingPets ? (
              <ActivityIndicator size="small" color="#F4A261" style={{ marginVertical: 10 }} />
            ) : pets.length === 0 ? (
              <ThemedText style={styles.radioLabel}>Nie znaleziono żadnych zwierzaków.</ThemedText>
            ) : (
              pets.map(pet => (
                <TouchableOpacity key={pet.id} style={styles.radioRow} onPress={() => setSelectedPet(pet.id)}>
                  <Ionicons
                    name={selectedPet === pet.id ? "radio-button-on" : "radio-button-off"}
                    size={24}
                    color={selectedPet === pet.id ? "#F4A261" : (theme === 'dark' ? '#A0A0A0' : 'black')}
                  />
                  <ThemedText style={[styles.radioLabel, { color: currentColors.text }]}>{pet.name}</ThemedText>
                </TouchableOpacity>
              ))
            )}

            <ThemedText style={[styles.label, { color: currentColors.text }]}>Data i czas</ThemedText>
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
                      {date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })}
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

            <ThemedText style={[styles.label, { color: currentColors.text }]}>Porcja</ThemedText>

            {/* SELEKTOR PORCJI (Tylko nazwy wielkości) */}
            <View style={styles.portionSegmentedContainer}>
              {PORTION_OPTIONS.map((option) => {
                const isSelected = selectedPortionId === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.portionSegmentButton,
                      isSelected && styles.portionSegmentButtonActive,
                    ]}
                    onPress={() => setSelectedPortionId(option.id)}
                    disabled={isSaving}
                  >
                    <ThemedText
                      style={[
                        styles.portionSegmentLabel,
                        isSelected && styles.portionSegmentLabelActive,
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText style={[styles.label, { color: currentColors.text }]}>Powtarzanie</ThemedText>

            <TouchableOpacity style={styles.radioRow} onPress={() => setRecurrence('ONCE')}>
              <Ionicons
                name={recurrence === 'ONCE' ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={recurrence === 'ONCE' ? "#F4A261" : (theme === 'dark' ? '#A0A0A0' : 'black')}
              />
              <ThemedText style={[styles.radioLabel, { color: currentColors.text }]}>Tylko raz (Bez powtórzeń)</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.radioRow} onPress={() => setRecurrence('DAILY')}>
              <Ionicons
                name={recurrence === 'DAILY' ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={recurrence === 'DAILY' ? "#F4A261" : (theme === 'dark' ? '#A0A0A0' : 'black')}
              />
              <ThemedText style={[styles.radioLabel, { color: currentColors.text }]}>Codziennie</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.radioRow} onPress={() => setRecurrence('WEEKLY')}>
              <Ionicons
                name={recurrence === 'WEEKLY' ? "radio-button-on" : "radio-button-off"}
                size={24}
                color={recurrence === 'WEEKLY' ? "#F4A261" : (theme === 'dark' ? '#A0A0A0' : 'black')}
              />
              <ThemedText style={[styles.radioLabel, { color: currentColors.text }]}>Co tydzień</ThemedText>
            </TouchableOpacity>

            {recurrence !== 'ONCE' && (
              <>
                <ThemedText style={[styles.label, { color: currentColors.text }]}>Powtarzaj do (Data zakończenia)</ThemedText>
                <View style={styles.dateTimeContainer}>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      onChange={handleWebEndDateChange}
                      style={webInputStyle}
                      value={endDate.toISOString().split('T')[0]}
                    />
                  ) : (
                    <TouchableOpacity style={styles.orangeInputFull} onPress={() => setShowPicker('endDate')}>
                      <ThemedText style={styles.whiteText}>
                        {endDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.doneButton,
              isSaving && { backgroundColor: theme === 'dark' ? '#5E412C' : '#fcd2b1' }
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <ThemedText style={styles.doneText}>Gotowe</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={showPicker === 'endDate' ? endDate : date}
          mode={showPicker === 'endDate' ? 'date' : showPicker}
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={date}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    width: '88%',
    borderRadius: 35,
    padding: 25,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 4,
  },
  modalTitle: { fontSize: 32, textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 22, marginTop: 15, marginBottom: 8, fontWeight: '500' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 2 },
  radioLabel: { fontSize: 18, marginLeft: 10 },
  dateTimeContainer: { flexDirection: 'row', gap: 10, width: '100%' },
  orangeInputFull: {
    backgroundColor: '#F4A261',
    borderRadius: 20,
    padding: 14,
    width: '100%',
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
  whiteText: { color: 'white', fontSize: 18, fontWeight: '500' },

  // STYLE DLA SEGMENTÓW (KAFFELKÓW)
  portionSegmentedContainer: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'space-between',
  },
  portionSegmentButton: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    paddingVertical: 16, // Nieco większy padding pionowy dla lepszego wyważenia bez gramatury
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  portionSegmentButtonActive: {
    backgroundColor: '#F4A261',
    borderColor: '#E76F51',
  },
  portionSegmentLabel: {
    fontSize: 18, // Zwiększyłem odrobinę czcionkę, skoro to jedyny tekst w kafelku
    fontWeight: 'bold',
    color: '#666',
  },
  portionSegmentLabelActive: {
    color: 'white',
  },

  doneButton: {
    backgroundColor: '#F4A261',
    borderRadius: 30,
    padding: 18,
    marginTop: 25,
    alignItems: 'center',
  },
  doneText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
});
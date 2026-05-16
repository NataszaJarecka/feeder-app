import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';

const TEMPORARY_PETS = [
  { id: '1', name: 'Hans' },
  { id: '2', name: 'Mika' }
];

const COLORS = [
  { name: 'Olive', hex: '#84a98c' },
  { name: 'Sky', hex: '#2196F3' },
  { name: 'Coral', hex: '#FF7F50' },
  { name: 'Gold', hex: '#FFD700' }
];

interface AddMealModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AddMealModal({ isVisible, onClose }: AddMealModalProps) {
  const [selectedPet, setSelectedPet] = useState(TEMPORARY_PETS[0].id);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState<'date' | 'time' | null>(null);
  const [portion, setPortion] = useState('50');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = () => {
    console.log("Zapisano posiłek:", {
      pet: TEMPORARY_PETS.find(p => p.id === selectedPet)?.name,
      time: date.toLocaleString(),
      portion: portion + 'g',
      color: selectedColor.name
    });
    onClose();
  };

  // Funkcja pomocnicza dla wersji WEB
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
          <ThemedText style={styles.modalTitle} type="title">Add Meal</ThemedText>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* PET */}
            <ThemedText style={styles.label}>Pet</ThemedText>
            {TEMPORARY_PETS.map(pet => (
              <TouchableOpacity key={pet.id} style={styles.radioRow} onPress={() => setSelectedPet(pet.id)}>
                <Ionicons
                  name={selectedPet === pet.id ? "radio-button-on" : "radio-button-off"}
                  size={24} color="black"
                />
                <ThemedText style={styles.radioLabel}>{pet.name}</ThemedText>
              </TouchableOpacity>
            ))}

            {/* TIME (Wersja WEB vs MOBILE) */}
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
                />
                <ThemedText style={styles.whiteText}>g</ThemedText>
              </View>
            </View>

            {/* COLOUR */}
            <ThemedText style={styles.label}>Colour</ThemedText>
            <View style={styles.colorSelectionRow}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color.hex },
                    selectedColor.name === color.name && styles.colorOptionSelected
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor.name === color.name && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.orangeInput, styles.rowCenter, { marginTop: 10 }]}>
              <View style={[styles.colorCircle, { backgroundColor: selectedColor.hex }]} />
              <ThemedText style={[styles.whiteText, { marginLeft: 10 }]}>
                {selectedColor.name}
              </ThemedText>
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.doneButton} onPress={handleSave}>
            <ThemedText style={styles.doneText}>Done</ThemedText>
          </TouchableOpacity>
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

// Styl dla inputów w przeglądarce
const webInputStyle: any = {
  backgroundColor: '#F4A261',
  border: 'none',
  borderRadius: '20px',
  color: 'white',
  padding: '14px',
  fontSize: '18px',
  fontWeight: '500', // To odpowiada ThemedText defaultSemiBold
  flex: 1,
  textAlign: 'center',
  cursor: 'pointer',
  fontFamily: 'sans-serif', // Lub konkretna czcionka Twojego projektu, np. 'SpaceMono'
  outline: 'none', // Usuwa niebieską obwódkę po kliknięciu
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
  rowCenter: { flexDirection: 'row', justifyContent: 'center' },
  whiteText: { color: 'white', fontSize: 18, fontWeight: '500' },
  textInput: { color: 'white', fontSize: 18, fontWeight: '500', textAlign: 'center', minWidth: 40 },
  colorSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 5
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  colorOptionSelected: {
    borderColor: '#555',
    transform: [{ scale: 1.1 }]
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
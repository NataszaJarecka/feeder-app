import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'; // <-- ZAPEWNIONY IMPORT DLA ZWYKŁEGO TEXT
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
// IMPORT MODALSTWÓW
import { AddMealModal } from '../../components/add_meal';
import { EditMealModal } from '../../components/edit_meal';

// IMPORT SERWISÓW I CONFIGU
import { auth } from '../../firebaseConfig';
import { getAllMealsByDate, Meal } from '../../services/feedingService';
import { getPetById, Pet } from '../../services/petService';

const HOUR_HEIGHT = 80;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface MealTileProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
}

const MealTile = ({ meal, onPress }: MealTileProps) => {
  const [pet, setPet] = useState<Pet | null>(null);

  const mealDate = meal.timestamp && typeof meal.timestamp.toDate === 'function'
    ? meal.timestamp.toDate()
    : new Date(meal.timestamp);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const petData = await getPetById(meal.petId);
        setPet(petData);
      } catch (e) {
        console.error("Błąd pobierania zwierzaka do kafelka:", e);
      }
    };
    if (meal.petId) {
      fetchPet();
    }
  }, [meal.petId]);

  const hour = mealDate.getHours();
  const minutes = mealDate.getMinutes();
  const tilePosition = (hour * HOUR_HEIGHT) + (minutes / 60 * HOUR_HEIGHT);

  const formattedTime = mealDate.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <TouchableOpacity
      style={[styles.mealTile, { top: tilePosition }]}
      onPress={() => onPress(meal)}
      activeOpacity={0.7}
    >
      <Image
        source={
          pet?.image && pet.image.trim() !== ''
            ? { uri: pet.image }
            : require('@/assets/images/dog_placeholder.png')
        }
        style={styles.tilePetImage}
      />
      <View style={styles.tileInfo}>
        <ThemedText style={styles.tilePetName}>{pet ? pet.name : 'Loading...'}</ThemedText>
        <ThemedText style={styles.tileTime}>{`${formattedTime} • ${meal.portionGrams}g`}</ThemedText>
      </View>
    </TouchableOpacity>
  );
};

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { petId } = useLocalSearchParams<{ petId: string }>();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [now, setNow] = useState(new Date());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchAllAnimalsMeals = async () => {
    setLoading(true);
    const currentUserId = auth.currentUser?.uid;

    try {
      const dayMeals = await getAllMealsByDate(selectedDate);

      if (!currentUserId) {
        setMeals([]);
        setLoading(false);
        return;
      }

      const filteredMealsPromises = dayMeals.map(async (meal) => {
        try {
          const petData = await getPetById(meal.petId);
          if (petData && petData.userId === currentUserId) {
            return meal;
          }
        } catch (e) {
          console.error(`Nie udało się pobrać danych zwierzaka ${meal.petId} do filtracji:`, e);
        }
        return null;
      });

      const resolvedMeals = await Promise.all(filteredMealsPromises);
      const userMeals = resolvedMeals.filter((meal): meal is Meal => meal !== null);

      console.log("Przefiltrowane posiłki dla zalogowanego użytkownika:", userMeals);
      setMeals(userMeals);

    } catch (error) {
      console.error("Błąd ładowania posiłków użytkownika do kalendarza:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAnimalsMeals();
  }, [selectedDate]);

  const changeDay = (amount: number) => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + amount);
    setSelectedDate(nextDay);
  };

  const handleOpenEditModal = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsEditModalVisible(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setSelectedMeal(null);
    fetchAllAnimalsMeals();
  };

  const formattedDate = selectedDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const indicatorPosition = (currentHour * HOUR_HEIGHT) + (currentMinutes / 60 * HOUR_HEIGHT);

  const isToday = selectedDate.toDateString() === now.toDateString();

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <View style={styles.headerSpacer} />
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <TouchableOpacity onPress={() => router.push('/notification')} style={styles.headerIcon}>
          <Ionicons name="notifications" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />

        {/* POPRAWIONO: ZWYKŁY <Text> IDENTYCZNIE JAK NA EKRANIE USTAWIEŃ */}
        <Text style={styles.pageTitle}>Schedule</Text>

        {/* NAWIGACJA DATĄ */}
        <View style={styles.dateSelector}>
          <TouchableOpacity onPress={() => changeDay(-1)}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
          <TouchableOpacity onPress={() => changeDay(1)}>
            <Ionicons name="chevron-forward" size={24} color="black" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.weeklyViewButton}
          onPress={() => router.push('/weekly_schedule')}
        >
          <ThemedText style={styles.weeklyViewButtonText}>Weekly View</ThemedText>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#FF8C42" style={{ marginTop: 50 }} />
        ) : (
          /* KALENDARZ / TIMELINE */
          <View style={styles.timelineContainer}>
            {HOURS.map((hour) => (
              <View key={hour} style={styles.hourRow}>
                <View style={styles.hourLabelContainer}>
                  <ThemedText style={styles.hourLabel}>{`${hour}:00`}</ThemedText>
                </View>
                <View style={styles.hourSlot} />
              </View>
            ))}

            {/* DYNAMICZNE KAFELKI POSIŁKÓW */}
            {meals.map((meal) => (
              <MealTile key={meal.id} meal={meal} onPress={handleOpenEditModal} />
            ))}

            {/* CZARNY PASEK OBECNEJ GODZINY */}
            {isToday && (
              <View style={[styles.timeIndicator, { top: indicatorPosition }]}>
                <View style={styles.indicatorDot} />
                <View style={styles.indicatorLine} />
                <View style={styles.indicatorDot} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL DODAWANIA */}
      <AddMealModal
        isVisible={isAddModalVisible}
        onClose={() => {
          setIsAddModalVisible(false);
          fetchAllAnimalsMeals();
        }}
      />

      {/* MODAL EDYCJI I USUWANIA */}
      <EditMealModal
        isVisible={isEditModalVisible}
        meal={selectedMeal}
        onClose={handleCloseEditModal}
      />

      {/* FAB BUTTON (DODAWANIE) */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
        <Ionicons name="add" size={40} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  headerSpacer: {
    width: 40
  },
  headerIcon: {
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 120
  },
  bgPaw: {
    position: 'absolute',
    width: 200,
    height: 200,
    opacity: 0.6,
    zIndex: -1
  },
  pawTopRight: {
    top: 10,
    right: 20,
    transform: [{ rotate: '15deg' }]
  },
  pawMidLeft: {
    top: 250,
    left: 20,
    transform: [{ rotate: '-10deg' }]
  },
  pageTitle: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 30,
    marginBottom: 40,
    color: '#000',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    marginVertical: 15,
    width: Dimensions.get('window').width * 0.85
  },
  dateText: {
    fontSize: 20,
    fontWeight: '500'
  },
  weeklyViewButton: {
    backgroundColor: '#FFCBA4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 15
  },
  weeklyViewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF8C42'
  },
  timelineContainer: {
    width: Dimensions.get('window').width,
    paddingLeft: 10,
    paddingRight: 15,
    position: 'relative'
  },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_HEIGHT
  },
  hourLabelContainer: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 10,
    marginTop: -10
  },
  hourLabel: {
    fontSize: 14,
    color: '#333'
  },
  hourSlot: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
    marginLeft: 5,
    borderRadius: 10,
    marginBottom: 5
  },
  timeIndicator: {
    position: 'absolute',
    left: 55,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100
  },
  indicatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'black'
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'black'
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#FF8C42',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  mealTile: {
    position: 'absolute',
    left: 75,
    right: 5,
    height: 60,
    backgroundColor: '#FFF3EA',
    borderColor: '#FF8C42',
    borderWidth: 1,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 90,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  tilePetImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc'
  },
  tileInfo: {
    marginLeft: 12,
    justifyContent: 'center',
    flex: 1
  },
  tilePetName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000'
  },
  tileTime: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
});
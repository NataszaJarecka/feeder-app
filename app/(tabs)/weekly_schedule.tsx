import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

// IMPORT MODALSTWÓW I SERWISÓW
import { AddMealModal } from '../../components/add_meal';
import { EditMealModal } from '../../components/edit_meal';
import { auth } from '../../firebaseConfig';
import { getAllMealsByDate, Meal } from '../../services/feedingService';
import { getPetById, Pet } from '../../services/petService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 80;
const TIME_LABEL_WIDTH = 50;

// Szeroka kolumna pozwalająca pomieścić pełne etykiety tekstowe
const COLUMN_WIDTH = 130;
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
    if (meal.petId) fetchPet();
  }, [meal.petId]);

  const hour = mealDate.getHours();
  const minutes = mealDate.getMinutes();
  const tilePosition = (hour * HOUR_HEIGHT) + (minutes / 60 * HOUR_HEIGHT);

  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

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
      {/* PRZYWRÓCONO: Identyczny układ i struktura jak w Twoim pierwszym kodzie */}
      <View style={styles.tileInfo}>
        <Text style={styles.tilePetName} numberOfLines={1}>{pet ? pet.name : 'Loading...'}</Text>
        <Text style={styles.tileTime} numberOfLines={1}>{`${formattedTime} • ${meal.portionGrams}g`}</Text>
      </View>
    </TouchableOpacity>
  );
};

interface DayColumnProps {
  date: Date;
  now: Date;
  onEditMeal: (meal: Meal) => void;
  refreshTrigger: boolean;
}

const DayColumn = ({ date, now, onEditMeal, refreshTrigger }: DayColumnProps) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      const currentUserId = auth.currentUser?.uid;

      try {
        const dayMeals = await getAllMealsByDate(date);

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
            console.error(`Nie udało się przefiltrować zwierzaka ${meal.petId}:`, e);
          }
          return null;
        });

        const resolvedMeals = await Promise.all(filteredMealsPromises);
        const userMeals = resolvedMeals.filter((meal): meal is Meal => meal !== null);

        setMeals(userMeals);
      } catch (error) {
        console.error("Błąd filtrowania kolumny tygodniowej:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, [date, refreshTrigger]);

  const isToday = date.toDateString() === now.toDateString();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const indicatorPosition = (currentHour * HOUR_HEIGHT) + (currentMinutes / 60 * HOUR_HEIGHT);

  return (
    <View style={styles.gridColumn}>
      {HOURS.map((hour) => (
        <View key={hour} style={styles.hourGridSlot} />
      ))}

      {loading ? (
        <ActivityIndicator size="small" color="#FF8C42" style={{ marginTop: 20 }} />
      ) : (
        meals.map((meal) => <MealTile key={meal.id} meal={meal} onPress={onEditMeal} />)
      )}

      {isToday && (
        <View style={[styles.columnTimeIndicator, { top: indicatorPosition }]} />
      )}
    </View>
  );
};

export default function WeeklyGridScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [now, setNow] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedWeekMonday, setSelectedWeekMonday] = useState<Date>(new Date());

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const current = new Date(selectedWeekMonday);
    const currentDayOfWeek = current.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

    const monday = new Date(current);
    monday.setDate(current.getDate() + distanceToMonday);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push(nextDay);
    }
    setWeekDates(days);
  }, [selectedWeekMonday]);

  const changeWeek = (amount: number) => {
    const nextWeekMonday = new Date(selectedWeekMonday);
    nextWeekMonday.setDate(selectedWeekMonday.getDate() + amount * 7);
    setSelectedWeekMonday(nextWeekMonday);
  };

  const handleOpenEditModal = (meal: Meal) => {
    setSelectedMeal(meal);
    setIsEditModalVisible(true);
  };

  const handleCloseModals = () => {
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    setSelectedMeal(null);
    setRefreshTrigger(!refreshTrigger);
  };

  const getWeekRange = () => {
    if (weekDates.length === 0) return 'Week';
    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    return `${firstDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${lastDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  };

  return (
    <ThemedView style={styles.container}>
      {/* HEADER GŁÓWNY */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <View style={styles.headerSpacer} />
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <TouchableOpacity onPress={() => router.push('/notification')} style={styles.headerIcon}>
          <Ionicons name="notifications" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Schedule</Text>

        {/* NAWIGACJA TYGODNI */}
        <View style={styles.weekNavigationGroup}>
          <TouchableOpacity onPress={() => changeWeek(-1)}>
            <Ionicons name="chevron-back" size={28} color="black" />
          </TouchableOpacity>
          <ThemedText style={styles.weekText}>{getWeekRange()}</ThemedText>
          <TouchableOpacity onPress={() => changeWeek(1)}>
            <Ionicons name="chevron-forward" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.dailyViewButton}
          onPress={() => router.push('/schedule')}
        >
          <ThemedText style={styles.dailyViewButtonText}>Daily View</ThemedText>
        </TouchableOpacity>

        {/* PRZEWIJANA SIATKA HORYZONTALNA */}
        <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} bounces={false}>
          <View style={styles.megaGridContainer}>

            {/* NAGŁÓWKI DNI */}
            <View style={styles.stickyHeaderContainer}>
              {weekDates.map((date, index) => {
                const isToday = date.toDateString() === now.toDateString();
                const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
                const dayNumber = date.getDate();

                return (
                  <View key={index} style={[styles.headerDayCell, isToday && styles.headerDayCellToday]}>
                    <ThemedText style={[styles.dayLabelText, isToday && styles.textOrange]}>{dayName}</ThemedText>
                    <ThemedText style={[styles.dayNumberText, isToday && styles.textOrangeBold]}>{dayNumber}</ThemedText>
                  </View>
                );
              })}
            </View>

            {/* INTEGRACJA OSI CZASU I KOLUMN */}
            <View style={styles.scheduleGridWrapper}>
              {/* KOLUMNA GODZIN */}
              <View style={styles.timeColumn}>
                {HOURS.map((hour) => (
                  <View key={hour} style={styles.hourLabelRow}>
                    <ThemedText style={styles.hourLabelText}>{`${hour}:00`}</ThemedText>
                  </View>
                ))}
              </View>

              {/* KONTENER KOLUMN */}
              <View style={styles.columnsContainer}>
                {weekDates.map((date, index) => (
                  <DayColumn
                    key={index}
                    date={date}
                    now={now}
                    onEditMeal={handleOpenEditModal}
                    refreshTrigger={refreshTrigger}
                  />
                ))}
              </View>
            </View>

          </View>
        </ScrollView>
      </ScrollView>

      {/* MODAL DODAWANIA */}
      <AddMealModal isVisible={isAddModalVisible} onClose={handleCloseModals} />

      {/* MODAL EDYCJI I USUWANIA */}
      <EditMealModal isVisible={isEditModalVisible} meal={selectedMeal} onClose={handleCloseModals} />

      {/* FAB BUTTON */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
        <Ionicons name="add" size={40} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
  headerSpacer: { width: 40 },
  headerIcon: { width: 40, alignItems: 'flex-end', justifyContent: 'center' },
  logo: { fontSize: 32, fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center', flex: 1 },
  weekNavigationGroup: { flexDirection: 'row', alignItems: 'center', gap: 15, justifyContent: 'center', marginVertical: 15 },
  weekText: { fontSize: 20, fontWeight: '500', color: '#000' },
  dailyViewButton: { backgroundColor: '#FFCBA4', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'center', marginBottom: 25 },
  dailyViewButtonText: { fontSize: 13, fontWeight: '600', color: '#FF8C42' },
  pageTitle: { fontSize: 42, textAlign: 'center', marginTop: 30, marginBottom: 15, fontWeight: '400', color: '#000' },
  scrollContent: { alignItems: 'center', paddingTop: 25, paddingBottom: 100 },

  megaGridContainer: { flexDirection: 'column' },
  stickyHeaderContainer: { flexDirection: 'row', paddingLeft: TIME_LABEL_WIDTH, backgroundColor: '#fff', zIndex: 10, paddingBottom: 10 },
  headerDayCell: { width: COLUMN_WIDTH, alignItems: 'center', paddingVertical: 8, borderWidth: 0.5, borderColor: '#e8e8e8', borderRadius: 12, marginHorizontal: 3, backgroundColor: '#fdfdfd' },
  headerDayCellToday: { backgroundColor: '#FFF3EA', borderColor: '#FF8C42', borderWidth: 1.5 },
  dayLabelText: { fontSize: 11, color: '#777', fontWeight: '600' },
  dayNumberText: { fontSize: 16, fontWeight: '600', marginTop: 2, color: '#000' },
  textOrange: { color: '#FF8C42' },
  textOrangeBold: { color: '#FF8C42', fontWeight: 'bold' },

  scheduleGridWrapper: { flexDirection: 'row' },
  timeColumn: { width: TIME_LABEL_WIDTH, alignItems: 'center', backgroundColor: 'white', zIndex: 5 },
  hourLabelRow: { height: HOUR_HEIGHT, justifyContent: 'flex-start', paddingTop: 2 },
  hourLabelText: { fontSize: 11, color: '#777' },
  columnsContainer: { flexDirection: 'row' },

  gridColumn: { width: COLUMN_WIDTH, position: 'relative', marginHorizontal: 3 },
  hourGridSlot: { height: HOUR_HEIGHT, borderWidth: 0.5, borderColor: '#f0f0f0', backgroundColor: '#fafafa', borderRadius: 4, marginBottom: 1 },
  columnTimeIndicator: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: '#FF8C42', zIndex: 100 },

  // PRZYWRÓCONO: Styl kafelka z Twojego pierwszego kodu (flexDirection: 'row')
  mealTile: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 60,
    backgroundColor: '#FFF3EA',
    borderColor: '#FF8C42',
    borderWidth: 1,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 90,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3
  },
  // PRZYWRÓCONO: Oryginalny rozmiar obrazka i marginesy
  tilePetImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc'
  },
  // PRZYWRÓCONO: Oryginalna struktura informacji tekstowej
  tileInfo: {
    marginLeft: 12,
    justifyContent: 'center',
    flex: 1
  },
  tilePetName: {
    fontSize: 14, // Zmniejszone z 16 na 14 dla bezpiecznego dopasowania w kolumnie poziomej
    fontWeight: 'bold',
    color: '#000'
  },
  tileTime: {
    fontSize: 12, // Zmniejszone z 13 na 12 dla idealnej spójności w wierszu
    color: '#666',
    marginTop: 2
  },

  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#FF8C42', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
});
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// IMPORT MODALI I SERWISÓW
import { AddMealModal } from '../../components/add_meal';
import { EditMealModal } from '../../components/edit_meal';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext'; // <-- IMPORT KONTEKSTU MOTYWÓW
import { auth } from '../../firebaseConfig';
import { getAllMealsByDate, Meal } from '../../services/feedingService';
import { getPetById, Pet } from '../../services/petService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HOUR_HEIGHT = 80;
const TIME_LABEL_WIDTH = 50;

const isMobile = SCREEN_WIDTH < 600;
const COLUMN_WIDTH = isMobile ? (SCREEN_WIDTH - TIME_LABEL_WIDTH - 24) / 4 : 130;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// ==========================================
// KOMPONENT: KAFELEK POSIŁKU (DLA OBU WIDOKÓW)
// ==========================================
interface MealTileProps {
  meal: Meal;
  onPress: (meal: Meal) => void;
  isWeeklyMode: boolean;
}

const MealTile = ({ meal, onPress, isWeeklyMode }: MealTileProps) => {
  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

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

  if (isWeeklyMode) {
    return (
      <TouchableOpacity
        style={[
          styles.weeklyMealTile,
          {
            top: tilePosition,
            backgroundColor: theme === 'dark' ? '#26292B' : '#FFF3EA',
            borderColor: theme === 'dark' ? '#444' : '#FF8C42'
          }
        ]}
        onPress={() => onPress(meal)}
        activeOpacity={0.7}
      >
        <Image
          source={
            pet?.image && pet.image.trim() !== ''
              ? { uri: pet.image }
              : require('@/assets/images/dog_placeholder.png')
          }
          style={styles.weeklyTilePetImage}
        />
        <View style={styles.weeklyTileInfo}>
          <Text style={[styles.weeklyTilePetName, { fontSize: isMobile ? 11 : 13, color: currentColors.text }]} numberOfLines={1}>
            {pet ? pet.name : '...'}
          </Text>
          <Text style={[styles.weeklyTileTime, { fontSize: isMobile ? 10 : 12, color: theme === 'dark' ? '#A0A0A0' : '#555' }]} numberOfLines={1}>
            {isMobile ? formattedTime : `${formattedTime} • ${meal.portionGrams}g`}
          </Text>
          {isMobile && <Text style={styles.weeklyTileGrams} numberOfLines={1}>{`${meal.portionGrams}g`}</Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.dailyMealTile,
        {
          top: tilePosition,
          backgroundColor: theme === 'dark' ? '#26292B' : '#FFF3EA',
          borderColor: theme === 'dark' ? '#444' : '#FF8C42'
        }
      ]}
      onPress={() => onPress(meal)}
      activeOpacity={0.7}
    >
      <Image
        source={
          pet?.image && pet.image.trim() !== ''
            ? { uri: pet.image }
            : require('@/assets/images/dog_placeholder.png')
        }
        style={styles.dailyTilePetImage}
      />
      <View style={styles.dailyTileInfo}>
        <Text style={[styles.dailyTilePetName, { color: currentColors.text }]}>{pet ? pet.name : 'Loading...'}</Text>
        <Text style={[styles.dailyTileTime, { color: theme === 'dark' ? '#A0A0A0' : '#666' }]}>{`${formattedTime} • ${meal.portionGrams}g`}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ==========================================
// KOMPONENT: KOLUMNA DNIA (TYLKO TYGODNIOWY)
// ==========================================
interface DayColumnProps {
  date: Date;
  now: Date;
  onEditMeal: (meal: Meal) => void;
  refreshTrigger: boolean;
}

const DayColumn = ({ date, now, onEditMeal, refreshTrigger }: DayColumnProps) => {
  const { currentTheme } = useAppTheme();
  const theme = currentTheme;

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
        <View
          key={hour}
          style={[
            styles.hourGridSlot,
            {
              borderColor: theme === 'dark' ? '#2A2C2E' : '#f0f0f0',
              backgroundColor: theme === 'dark' ? '#191B1C' : '#fafafa'
            }
          ]}
        />
      ))}

      {loading ? (
        <ActivityIndicator size="small" color="#FF8C42" style={{ marginTop: 20 }} />
      ) : (
        meals.map((meal) => <MealTile key={meal.id} meal={meal} onPress={onEditMeal} isWeeklyMode={true} />)
      )}

      {isToday && (
        <View style={[styles.columnTimeIndicator, { top: indicatorPosition }]} />
      )}
    </View>
  );
};

// ==========================================
// GŁÓWNY EKRAN: SCHEDULE SCREEN
// ==========================================
export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { petId } = useLocalSearchParams<{ petId: string }>();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyMeals, setDailyMeals] = useState<Meal[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [now, setNow] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedWeekMonday, setSelectedWeekMonday] = useState<Date>(new Date());
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

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

  const fetchDailyMeals = async () => {
    setDailyLoading(true);
    const currentUserId = auth.currentUser?.uid;

    try {
      const dayMeals = await getAllMealsByDate(selectedDate);

      if (!currentUserId) {
        setDailyMeals([]);
        setDailyLoading(false);
        return;
      }

      const filteredMealsPromises = dayMeals.map(async (meal) => {
        try {
          const petData = await getPetById(meal.petId);
          if (petData && petData.userId === currentUserId) {
            return meal;
          }
        } catch (e) {
          console.error(`Nie udało się pobrać danych zwierzaka ${meal.petId}:`, e);
        }
        return null;
      });

      const resolvedMeals = await Promise.all(filteredMealsPromises);
      const userMeals = resolvedMeals.filter((meal): meal is Meal => meal !== null);

      setDailyMeals(userMeals);
    } catch (error) {
      console.error("Błąd ładowania posiłków:", error);
    } finally {
      setDailyLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (viewMode === 'daily') {
        fetchDailyMeals();
      }
    }, [selectedDate, viewMode])
  );

  const changeDay = (amount: number) => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + amount);
    setSelectedDate(nextDay);
  };

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
    fetchDailyMeals();
  };

  const formattedDailyDate = selectedDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getWeekRangeLabel = () => {
    if (weekDates.length === 0) return 'Week';
    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    return `${firstDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${lastDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  };

  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const dailyIndicatorPosition = (currentHour * HOUR_HEIGHT) + (currentMinutes / 60 * HOUR_HEIGHT);
  const isTodayDaily = selectedDate.toDateString() === now.toDateString();

  return (
    <ThemedView style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* HEADER GŁÓWNY Z DYNAMICZNYM TŁEM I BIAŁYM CIENIEM */}
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
        <View style={styles.headerSide} />
        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>

        <TouchableOpacity
          onPress={() => router.push('/notification')}
          style={[styles.headerSide, { alignItems: 'flex-end' }]}
        >
          <Ionicons name="notifications" size={28} color={currentColors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={[styles.scrollContent, viewMode === 'weekly' && styles.scrollContentWeekly]}
        style={{ backgroundColor: currentColors.background }}
      >
        {/* Łapki dekoracyjne (zmieniają odcień na biały w trybie nocnym) */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        <Text style={[styles.pageTitle, { color: currentColors.text }]}>Schedule</Text>

        <View style={styles.controlsGroup}>
          {viewMode === 'daily' ? (
            <View style={styles.navigationRow}>
              <TouchableOpacity onPress={() => changeDay(-1)}>
                <Ionicons name="chevron-back" size={24} color={currentColors.text} />
              </TouchableOpacity>
              <Text style={[styles.navigationText, { color: currentColors.text }]}>{formattedDailyDate}</Text>
              <TouchableOpacity onPress={() => changeDay(1)}>
                <Ionicons name="chevron-forward" size={24} color={currentColors.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.navigationRow}>
              <TouchableOpacity onPress={() => changeWeek(-1)}>
                <Ionicons name="chevron-back" size={24} color={currentColors.text} />
              </TouchableOpacity>
              <Text style={[styles.navigationText, { color: currentColors.text }]}>{getWeekRangeLabel()}</Text>
              <TouchableOpacity onPress={() => changeWeek(1)}>
                <Ionicons name="chevron-forward" size={24} color={currentColors.text} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.toggleViewButton, { backgroundColor: theme === 'dark' ? '#26292B' : '#FFCBA4' }]}
            onPress={() => setViewMode(viewMode === 'daily' ? 'weekly' : 'daily')}
          >
            <Text style={[styles.toggleViewButtonText, { color: '#FF8C42' }]}>
              {viewMode === 'daily' ? 'Weekly View' : 'Daily View'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* WARUNKOWE RENDEROWANIE SAMEJ OSI CZASU */}
        {viewMode === 'daily' ? (
          dailyLoading ? (
            <ActivityIndicator size="large" color="#FF8C42" style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.dailyTimelineContainer}>
              {HOURS.map((hour) => (
                <View key={hour} style={styles.dailyHourRow}>
                  <View style={styles.dailyHourLabelContainer}>
                    <Text style={[styles.dailyHourLabel, { color: theme === 'dark' ? '#A0A0A0' : '#333' }]}>{`${hour}:00`}</Text>
                  </View>
                  <View style={[styles.dailyHourSlot, { borderTopColor: theme === 'dark' ? '#2A2C2E' : '#f0f0f0', backgroundColor: theme === 'dark' ? '#191B1C' : '#f9f9f9' }]} />
                </View>
              ))}

              {dailyMeals.map((meal) => (
                <MealTile key={meal.id} meal={meal} onPress={handleOpenEditModal} isWeeklyMode={false} />
              ))}

              {isTodayDaily && (
                <View style={[styles.dailyTimeIndicator, { left: 55, right: 15 }]}>
                  <View style={[styles.dailyIndicatorDot, { backgroundColor: currentColors.text }]} />
                  <View style={[styles.dailyIndicatorLine, { backgroundColor: currentColors.text }]} />
                  <View style={[styles.dailyIndicatorDot, { backgroundColor: currentColors.text }]} />
                </View>
              )}
            </View>
          )
        ) : (
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} bounces={false} style={styles.horizontalScroll}>
            <View style={[styles.megaGridContainer, { backgroundColor: currentColors.background }]}>

              {/* NAGŁÓWKI DNI */}
              <View style={[styles.stickyHeaderContainer, { backgroundColor: currentColors.background }]}>
                {weekDates.map((date, index) => {
                  const isTodayColumn = date.toDateString() === now.toDateString();
                  const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
                  const dayNumber = date.getDate();

                  return (
                    <View
                      key={index}
                      style={[
                        styles.headerDayCell,
                        {
                          borderColor: theme === 'dark' ? '#333' : '#e8e8e8',
                          backgroundColor: theme === 'dark' ? '#26292B' : '#fdfdfd'
                        },
                        isTodayColumn && (theme === 'dark' ? { backgroundColor: '#3D2419', borderColor: '#FF8C42', borderWidth: 1.5 } : styles.headerDayCellToday)
                      ]}
                    >
                      <Text style={[styles.dayLabelText, { color: theme === 'dark' ? '#A0A0A0' : '#777' }, isTodayColumn && styles.textOrange]}>{dayName}</Text>
                      <Text style={[styles.dayNumberText, { color: currentColors.text }, isTodayColumn && styles.textOrangeBold]}>{dayNumber}</Text>
                    </View>
                  );
                })}
              </View>

              {/* INTEGRACJA OSI CZASU I KOLUMN W SIATCE */}
              <View style={styles.scheduleGridWrapper}>
                <View style={[styles.timeColumn, { backgroundColor: currentColors.background }]}>
                  {HOURS.map((hour) => (
                    <View key={hour} style={styles.hourLabelRow}>
                      <Text style={[styles.hourLabelText, { color: theme === 'dark' ? '#A0A0A0' : '#777' }]}>{`${hour}:00`}</Text>
                    </View>
                  ))}
                </View>

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
        )}
      </ScrollView>

      {/* MODALE */}
      <AddMealModal isVisible={isAddModalVisible} onClose={handleCloseModals} />
      <EditMealModal isVisible={isEditModalVisible} meal={selectedMeal} onClose={handleCloseModals} />

      {/* PRZYCISK FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
        <Ionicons name="add" size={40} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 999
  },
  logo: { fontSize: 32, fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center', flex: 1 },
  pageTitle: { fontSize: 42, textAlign: 'center', marginTop: 30, marginBottom: 15, fontWeight: '400' },

  scrollContent: { paddingBottom: 120 },
  scrollContentWeekly: { paddingBottom: 100, alignItems: 'stretch' },

  controlsGroup: { width: '100%', alignItems: 'center' },
  navigationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 25, marginVertical: 15, width: SCREEN_WIDTH * 0.85, height: 35 },
  navigationText: { fontSize: 20, fontWeight: '500', textAlign: 'center' },
  toggleViewButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignSelf: 'center', marginBottom: 25, height: 35, justifyContent: 'center' },
  toggleViewButtonText: { fontSize: 13, fontWeight: '600' },

  bgPaw: { position: 'absolute', width: 200, height: 200, opacity: 0.6, zIndex: -1 },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },

  dailyTimelineContainer: { width: SCREEN_WIDTH, paddingLeft: 10, paddingRight: 15, position: 'relative' },
  dailyHourRow: { flexDirection: 'row', height: HOUR_HEIGHT },
  dailyHourLabelContainer: { width: 60, alignItems: 'flex-end', paddingRight: 10, marginTop: -10 },
  dailyHourLabel: { fontSize: 14 },
  dailyHourSlot: { flex: 1, borderTopWidth: 1, marginLeft: 5, borderRadius: 10, marginBottom: 5 },
  dailyTimeIndicator: { position: 'absolute', flexDirection: 'row', alignItems: 'center', zIndex: 100 },
  dailyIndicatorLine: { flex: 1, height: 2 },
  dailyIndicatorDot: { width: 6, height: 6, borderRadius: 3 },
  dailyMealTile: { position: 'absolute', left: 75, right: 5, height: 60, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, zIndex: 90, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  dailyTilePetImage: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc' },
  dailyTileInfo: { marginLeft: 12, justifyContent: 'center', flex: 1 },
  dailyTilePetName: { fontSize: 16, fontWeight: 'bold' },
  dailyTileTime: { fontSize: 13, marginTop: 2 },

  horizontalScroll: { width: '100%', zIndex: 5 },
  megaGridContainer: { flexDirection: 'column', paddingHorizontal: 10, alignSelf: 'center' },
  stickyHeaderContainer: { flexDirection: 'row', paddingLeft: TIME_LABEL_WIDTH, zIndex: 10, paddingBottom: 10 },
  headerDayCell: { width: COLUMN_WIDTH, alignItems: 'center', paddingVertical: 8, borderWidth: 0.5, borderRadius: 12, marginHorizontal: 2 },
  headerDayCellToday: { backgroundColor: '#FFF3EA', borderColor: '#FF8C42', borderWidth: 1.5 },
  dayLabelText: { fontSize: 11, fontWeight: '600' },
  dayNumberText: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  textOrange: { color: '#FF8C42' },
  textOrangeBold: { color: '#FF8C42', fontWeight: 'bold' },
  scheduleGridWrapper: { flexDirection: 'row' },
  timeColumn: { width: TIME_LABEL_WIDTH, alignItems: 'center', zIndex: 5 },
  hourLabelRow: { height: HOUR_HEIGHT, justifyContent: 'flex-start', paddingTop: 2 },
  hourLabelText: { fontSize: 11 },
  columnsContainer: { flexDirection: 'row' },
  gridColumn: { width: COLUMN_WIDTH, position: 'relative', marginHorizontal: 2 },
  hourGridSlot: { height: HOUR_HEIGHT, borderWidth: 0.5, borderRadius: 4, marginBottom: 1 },
  columnTimeIndicator: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: '#FF8C42', zIndex: 100 },
  weeklyMealTile: { position: 'absolute', left: 1, right: 1, height: 65, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, zIndex: 90, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2 },
  weeklyTilePetImage: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ccc' },
  weeklyTileInfo: { marginLeft: 4, justifyContent: 'center', flex: 1 },
  weeklyTilePetName: { fontWeight: 'bold' },
  weeklyTileTime: { marginTop: 1 },
  weeklyTileGrams: { fontSize: 10, fontWeight: '600', color: '#FF8C42' },
  headerSide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  fab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#FF8C42', width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
});
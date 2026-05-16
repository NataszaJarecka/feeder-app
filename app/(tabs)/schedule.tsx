import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

// IMPORT MODALA (Upewnij się, że ścieżka i nazwa pliku są poprawne)
import { AddMealModal } from '../../components/add_meal';

const HOUR_HEIGHT = 80;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ScheduleScreen() {
  const router = useRouter();
  const [now, setNow] = useState(new Date());

  // STAN MODALA
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const indicatorPosition = (currentHour * HOUR_HEIGHT) + (currentMinutes / 60 * HOUR_HEIGHT);

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ width: 32 }} />
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <TouchableOpacity onPress={() => router.push('/notification')}>
          <Ionicons name="notifications" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

        {/* TYTUŁ */}
        <ThemedText style={styles.pageTitle}>Schedule</ThemedText>

        {/* NAWIGACJA DATĄ */}
        <View style={styles.dateSelector}>
          <TouchableOpacity><Ionicons name="chevron-back" size={24} color="black" /></TouchableOpacity>
          <ThemedText style={styles.dateText}>{formattedDate}</ThemedText>
          <TouchableOpacity><Ionicons name="chevron-forward" size={24} color="black" /></TouchableOpacity>
        </View>

        {/* KALENDARZ / TIMELINE */}
        <View style={styles.timelineContainer}>

          {HOURS.map((hour) => (
            <View key={hour} style={styles.hourRow}>
              <View style={styles.hourLabelContainer}>
                <ThemedText style={styles.hourLabel}>{`${hour}:00`}</ThemedText>
              </View>
              <View style={styles.hourSlot} />
            </View>
          ))}

          {/* CZARNY PASEK OBECNEJ GODZINY */}
          <View style={[styles.timeIndicator, { top: indicatorPosition }]}>
            <View style={styles.indicatorDot} />
            <View style={styles.indicatorLine} />
            <View style={styles.indicatorDot} />
          </View>
        </View>
      </ScrollView>

      {/* MODAL DODAWANIA (Wywoływany stanem) */}
      <AddMealModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />

      {/* FAB (Floating Action Button) - KLIKNIĘCIE OTWIERA MODAL */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add" size={40} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  scrollContent: {
    paddingBottom: 100,
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
  pageTitle: {
    fontSize: 42,
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 40,
    fontWeight: '400',
    color: '#000',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    gap: 15,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '500',
  },
  timelineContainer: {
    paddingLeft: 10,
    paddingRight: 20,
    position: 'relative',
  },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
  },
  hourLabelContainer: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 10,
    marginTop: -10,
  },
  hourLabel: {
    fontSize: 14,
    color: '#333',
  },
  hourSlot: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f9f9f9',
    marginLeft: 5,
    borderRadius: 10,
    marginBottom: 5,
  },
  timeIndicator: {
    position: 'absolute',
    left: 55,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  indicatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'black',
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'black',
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
    shadowRadius: 5,
  },
});
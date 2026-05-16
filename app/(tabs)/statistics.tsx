import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const { width } = Dimensions.get('window');

const StatisticsScreen = () => {
  const router = useRouter();
  const [mikaExpanded, setMikaExpanded] = useState(true);
  const [maxExpanded, setMaxExpanded] = useState(false);
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

          {/* TYTUŁ SEKCJI */}
          <Text style={styles.mainTitle}>Statistics</Text>

          {/* SELEKTOR DATY */}
          <View style={styles.dateSelector}>
            <TouchableOpacity><Ionicons name="chevron-back" size={30} color="black" /></TouchableOpacity>
            <Text style={styles.dateText}>Today</Text>
            <TouchableOpacity><Ionicons name="chevron-forward" size={30} color="black" /></TouchableOpacity>
          </View>

          {/* KARTA MIKA (ROZWINIĘTA) */}
          <View style={styles.cardWrapper}>
            <View style={styles.cardHeader}>
              <Text style={styles.petName}>Mika</Text>
              <TouchableOpacity onPress={() => setMikaExpanded(!mikaExpanded)}>
                <MaterialCommunityIcons name={mikaExpanded ? "minus" : "plus"} size={35} color="white" />
              </TouchableOpacity>
            </View>

            {mikaExpanded && (
              <View style={styles.cardBody}>
                <Text style={styles.statLabel}>Meals eaten:</Text>
                <Text style={styles.statValue}>2</Text>

                <Text style={styles.statLabel}>Unfinished meals:</Text>
                <Text style={styles.statValue}>1</Text>

                <Text style={styles.statLabel}>Average eating speed:</Text>
                <Text style={styles.statValue}>2 g/s</Text>
              </View>
            )}
          </View>

          {/* KARTA Hans (ZWINIĘTA) */}
          <View style={styles.cardWrapper}>
            <View style={styles.cardHeader}>
              <Text style={styles.petName}>Hans</Text>
              <TouchableOpacity onPress={() => setMaxExpanded(!maxExpanded)}>
                <MaterialCommunityIcons name={maxExpanded ? "minus" : "plus"} size={35} color="white" />
              </TouchableOpacity>
            </View>
            {maxExpanded && (
              <View style={styles.cardBody}>
                <Text style={styles.statLabel}>Meals eaten:</Text>
                <Text style={styles.statValue}>3</Text>

                <Text style={styles.statLabel}>Unfinished meals:</Text>
                <Text style={styles.statValue}>0</Text>

                <Text style={styles.statLabel}>Average eating speed:</Text>
                <Text style={styles.statValue}>1.5 g/s</Text>
              </View>
            )}
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
  // Stylizacja tła (łapy)
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
    alignItems: 'center',
    paddingBottom: 100,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 30,
    marginBottom: 40,
    color: '#000',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: width * 0.6,
    marginVertical: 25,
  },
  dateText: {
    fontSize: 34,
    fontWeight: '400',
  },
  // Stylizacja kart
  cardWrapper: {
    width: width * 0.85,
    backgroundColor: '#FFF',
    borderRadius: 35,
    marginBottom: 25,
    // Cień dla iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    // Cień dla Android
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E99664', // Kolor ze screena
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 35,
  },
  petName: {
    fontSize: 38,
    color: 'white',
    fontWeight: '300',
  },
  cardBody: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 22,
    color: '#000',
    marginTop: 15,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '300',
    color: '#777',
    marginTop: 5,
  },
});

export default StatisticsScreen;
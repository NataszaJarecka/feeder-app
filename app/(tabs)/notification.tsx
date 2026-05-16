import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const { width } = Dimensions.get('window');

const NotificationsScreen = () => {
  // Przykładowe dane powiadomień
  const notifications = [
    { id: '1', time: '10:00', type: 'pet', name: 'Hans', msg: "hasn't finished a meal!", img: require('@/assets/images/dog-photo.jpg') },
    { id: '2', time: '9:00', type: 'pet', name: 'Mika', msg: "hasn't finished a meal!", img: require('@/assets/images/mika-photo.jpg') },
    { id: '3', time: 'yesterday, 22:00', type: 'alert', msg: "Failed to serve a meal!", subMsg: "Please check the feeder." },
    { id: '4', time: 'yesterday, 18:00', type: 'pet', name: 'Hans', msg: "hasn't finished a meal!", img: require('@/assets/images/dog-photo.jpg') },
  ];

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <TouchableOpacity style={styles.headerSide}>
          <Ionicons name="notifications" size={28} color="#E99664" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

        <View style={styles.content}>
          <TouchableOpacity style={styles.clearAllBtn}>
            <Text style={styles.clearAllText}>clear all</Text>
          </TouchableOpacity>

          {notifications.map((item) => (
            <View key={item.id} style={styles.notificationWrapper}>
              <Text style={styles.timeLabel}>{item.time}</Text>

              <View style={[styles.card, item.type === 'alert' ? styles.alertCard : null]}>
                {item.type === 'pet' ? (
                  <>
                    <Image source={item.img} style={styles.avatar} />
                    <Text style={styles.notificationText}>
                      <Text style={{ fontWeight: '500' }}>{item.name}</Text> {item.msg}
                    </Text>
                  </>
                ) : (
                  <View style={styles.alertContent}>
                    <View style={styles.alertIconContainer}>
                        <Text style={styles.exclamationMark}>!</Text>
                    </View>
                    <View style={styles.alertTextContainer}>
                        <Text style={styles.alertTitle}>{item.msg}</Text>
                        <Text style={styles.alertSubTitle}>{item.subMsg}</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
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
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
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
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  clearAllBtn: {
    alignSelf: 'flex-start',
    marginVertical: 15,
  },
  clearAllText: {
    fontSize: 22,
    color: '#666',
    fontWeight: '300',
  },
  notificationWrapper: {
    marginBottom: 20,
  },
  timeLabel: {
    fontSize: 18,
    color: '#333',
    marginLeft: 30,
    marginBottom: 5,
  },
  card: {
    backgroundColor: '#EEA179', // Kolor pomarańczowy z obrazka
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 15,
    minHeight: 90,
  },
  alertCard: {
    backgroundColor: '#EEA179', // Ten sam kolor co pet card
  },
  avatar: {
    width: 65,
    height: 65,
    borderRadius: 35,
  },
  notificationText: {
    flex: 1,
    color: 'white',
    fontSize: 22,
    marginLeft: 15,
    fontWeight: '300',
    textAlign: 'center',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertIconContainer: {
    width: 60,
    alignItems: 'center',
  },
  exclamationMark: {
    fontSize: 60,
    color: 'white',
    fontWeight: 'bold',
  },
  alertTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  alertTitle: {
    color: 'white',
    fontSize: 22,
    textAlign: 'center',
  },
  alertSubTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
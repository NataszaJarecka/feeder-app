import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';
import { auth } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

const SettingsScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const settingsOptions = [
    { id: 'account', label: 'My account', icon: 'person-outline' },
    { id: 'theme', label: 'Theme', icon: 'color-palette-outline' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* HEADER Z DYNAMICZNYMI KOLORAMI I BIAŁYM CIENIEM */}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TŁO - ŁAPY */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        {/* TYTUŁ SEKCJI */}
        <Text style={[styles.mainTitle, { color: currentColors.text }]}>Settings</Text>

        {/* LISTA USTAWIEŃ */}
        <View style={styles.settingsList}>
          {settingsOptions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingCard,
                { backgroundColor: theme === 'dark' ? '#26292B' : '#FFF' }
              ]}
              onPress={() => {
                if (item.id === 'account') {
                  router.push('/my_account' as any);
                } else if (item.id === 'theme') {
                  router.push('/theme' as any);
                } else if (item.id === 'notifications') {
                  router.push('/set_notification' as any);
                }
              }}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconWrapper}>
                  <Ionicons name={item.icon as any} size={30} color="white" />
                </View>
                <Text style={[styles.settingLabel, { color: currentColors.text }]}>{item.label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#555' : '#CCC'} />
            </TouchableOpacity>
          ))}
        </View>

        {/* PRZYCISK LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się wylogować.');
            }
          }}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  // NAPRAWIONO: Usunięto sztywne białe tło z container, teraz działa z destrukturyzacji u góry
  container: {
    flex: 1,
    overflow: 'visible',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  headerSide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
  },
  bgPaw: {
    position: 'absolute',
    width: 200,
    height: 200,
    opacity: 0.6,
    zIndex: -1,
  },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 100,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 30,
    marginBottom: 40,
    textAlign: 'center',
  },
  settingsList: {
    width: width * 0.85,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    backgroundColor: '#E99664',
    padding: 10,
    borderRadius: 15,
    marginRight: 20,
  },
  settingLabel: {
    fontSize: 22,
    fontWeight: '300',
  },
  logoutBtn: {
    marginTop: 20,
    padding: 15,
  },
  logoutText: {
    fontSize: 20,
    color: '#E99664',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

export default SettingsScreen;
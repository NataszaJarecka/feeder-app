import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

// IMPORTY FIREBASE
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

// IMPORT FUNKCJI ZLICZAJĄCEJ Z TWOJEGO SERWISU ZWIERZAKÓW
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext'; // <-- IMPORT KONTEKSTU MOTYWÓW
import { getPetsCountByUser } from '../../services/petService';

const { width } = Dimensions.get('window');

const AccountScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Pobieramy motyw aplikacji z Twojego kontekstu
  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  // STANY DLA REALNYCH DANYCH
  const [username, setUsername] = useState('Loading...');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [petsCount, setPetsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const currentUser = auth.currentUser;

        if (currentUser) {
          setEmail(currentUser.email || 'No email');

          try {
            // 1. Pobieranie danych profilu użytkownika
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setUsername(userData.username || 'Anonymous');
              setAvatarUrl(userData.image || null);
            } else {
              setUsername('User Profile');
            }

            // 2. Pobieranie rzeczywistej liczby zwierzaków
            const count = await getPetsCountByUser(currentUser.uid);
            setPetsCount(count);

          } catch (error) {
            console.error('Error fetching user data or pets count:', error);
            setUsername('Error loading name');
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      };

      fetchUserData();

      return () => {
        // Funkcja czyszcząca
      };
    }, [])
  );

  const handleLogOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: currentColors.background }]}>
      {/* HEADER Z DYNAMICZNYMI KOLORAMI I SPÓJNYM CIENIEM */}
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
        {/* Niezmieniony rodzaj strzałki ('arrow-back') ze zaktualizowanym kolorem */}
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={28} color={currentColors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TŁO - ŁAPY (Zmieniają kolor na biały w trybie ciemnym) */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        {/* PROFIL USERA */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                avatarUrl && avatarUrl.trim() !== ''
                  ? { uri: avatarUrl }
                  : require('@/assets/images/user_placeholder.png')
              }
              style={[styles.profileImage, { borderColor: theme === 'dark' ? '#26292B' : '#E99664' }]}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#E99664" style={{ marginTop: 10 }} />
          ) : (
            <>
              <Text style={[styles.userName, { color: currentColors.text }]}>{username}</Text>
              <Text style={[styles.userEmail, { color: theme === 'dark' ? '#A0A0A0' : '#888' }]}>{email}</Text>
            </>
          )}
        </View>

        {/* STATYSTYKA - ZWIERZĘTA */}
        <View style={[styles.statsRow, { backgroundColor: theme === 'dark' ? '#26292B' : '#fff' }]}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{loading ? '...' : petsCount}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#A0A0A0' : '#666' }]}>
              {petsCount === 1 ? 'Pet' : 'Pets'}
            </Text>
          </View>
        </View>

        {/* MENU PRZYCISKÓW */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme === 'dark' ? '#333' : '#F0F0F0' }]}
            onPress={() => router.push('/edit_profile')}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            <Text style={[styles.menuText, { color: currentColors.text }]}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#555' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { marginTop: 20, borderBottomWidth: 0 }]} onPress={handleLogOut}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#FF5A5F' }]}>
              <Ionicons name="log-out" size={24} color="white" />
            </View>
            <Text style={[styles.menuText, { color: '#FF5A5F' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  // Zunifikowana szerokość 40 dla idealnego wyśrodkowania logo
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
    paddingBottom: 50,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 20,
    minHeight: 200,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 16,
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    width: width * 0.4,
    borderRadius: 25,
    marginTop: 30,
    paddingVertical: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E99664',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  menuContainer: {
    width: width * 0.9,
    marginTop: 40,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  menuIconCircle: {
    backgroundColor: '#E99664',
    padding: 10,
    borderRadius: 15,
    marginRight: 20,
  },
  menuText: {
    fontSize: 22,
    fontWeight: '300',
  },
});

export default AccountScreen;
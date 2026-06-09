import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';
import { getPetsCountByUser } from '../../services/petService';

const { width } = Dimensions.get('window');

// Bezpieczna funkcja obsługująca polską odmianę liczby mnogiej (bez Intl.PluralRules)
const getPolishPetLabel = (count: number) => {
  if (count === 0) return 'brak zwierzaków';
  if (count === 1) return 'zwierzak';

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  // Reguła dla języka polskiego: końcówki 2, 3, 4 (ale nie 12, 13, 14) -> "zwierzaki"
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 10 || lastTwoDigits >= 20)) {
    return 'zwierzaki';  // np. 2, 3, 4, 22, 23, 24...
  }

  return 'zwierzaków'; // np. 5-21, 25-30, 1025...
};

const AccountScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [username, setUsername] = useState('Wczytywanie...');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [petsCount, setPetsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchUserData = async () => {
        const currentUser = auth.currentUser;

        if (currentUser) {
          setEmail(currentUser.email || 'Brak adresu e-mail');

          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              setUsername(userData.username || 'Użytkownik anonimowy');
              setAvatarUrl(userData.image || null);
            } else {
              setUsername('Profil użytkownika');
            }

            const count = await getPetsCountByUser(currentUser.uid);
            setPetsCount(count);

          } catch (error) {
            console.error('Error fetching user data or pets count:', error);
            setUsername('Błąd ładowania nazwy');
          } finally {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      };

      fetchUserData();

      return () => {
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
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={28} color={currentColors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

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

        <View style={[styles.statsRow, { backgroundColor: theme === 'dark' ? '#26292B' : '#fff' }]}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {loading ? '...' : (petsCount === 0 ? '' : petsCount)}
            </Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#A0A0A0' : '#666' }]}>
              {loading ? 'zwierzaki' : getPolishPetLabel(petsCount)}
            </Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomColor: theme === 'dark' ? '#333' : '#F0F0F0' }]}
            onPress={() => router.push('/edit_profile')}
          >
            <View style={styles.menuIconCircle}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            <Text style={[styles.menuText, { color: currentColors.text }]}>Edytuj profil</Text>
            <Ionicons name="chevron-forward" size={24} color={theme === 'dark' ? '#555' : '#CCC'} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { marginTop: 20, borderBottomWidth: 0 }]} onPress={handleLogOut}>
            <View style={[styles.menuIconCircle, { backgroundColor: '#FF5A5F' }]}>
              <Ionicons name="log-out" size={24} color="white" />
            </View>
            <Text style={[styles.menuText, { color: '#FF5A5F' }]}>Wyloguj się</Text>
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

// IMPORTY FIREBASE
import { signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

const AccountScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // STANY DLA REALNYCH DANYCH
  const [username, setUsername] = useState('Loading...');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        setEmail(currentUser.email || 'No email');

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setUsername(userData.username || 'Anonymous');
          } else {
            setUsername('User Profile');
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
          setUsername('Error loading name');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerSideLeft}>
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TŁO - ŁAPY */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

        {/* PROFIL USERA */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('@/assets/images/user_placeholder.png')} // Zmiana na lokalny plik z Twoich assets
              style={styles.profileImage}
            />
            {/* Przycisk edycji (badge z aparatem) został usunięty stąd */}
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#E99664" style={{ marginTop: 10 }} />
          ) : (
            <>
              <Text style={styles.userName}>{username}</Text>
              <Text style={styles.userEmail}>{email}</Text>
            </>
          )}
        </View>

        {/* JEDYNA STATYSTYKA - ZWIERZĘTA */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>2</Text>
            <Text style={styles.statLabel}>Pets</Text>
          </View>
        </View>

        {/* MENU PRZYCISKÓW */}
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit_profile')}>
            <View style={styles.menuIconCircle}>
              <Ionicons name="person" size={24} color="white" />
            </View>
            <Text style={styles.menuText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={24} color="#CCC" />
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerSideLeft: {
    width: 32,
    alignItems: 'flex-start',
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
    borderColor: '#E99664',
  },
  userName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    width: width * 0.4, // Zmniejszyłem szerokość karty, żeby pojedyncza statystyka wyglądała zgrabnie i symetrycznie
    backgroundColor: '#fff',
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
    color: '#666',
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
    borderBottomColor: '#F0F0F0',
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
    color: '#000',
  },
});

export default AccountScreen;
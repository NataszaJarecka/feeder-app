import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

// IMPORT USŁUG FIREBASE
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

const AuthScreen = () => {
  const insets = useSafeAreaInsets();

  // Kontrola trybu: true = Logowanie, false = Rejestracja
  const [isLogin, setIsLogin] = useState(true);

  // Stany formularza
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  // Miejsce na komunikat o błędzie wyświetlany na ekranie
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Czyszczenie pól i błędów przy przełączaniu trybów
  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
    setErrorMessage(null);
  };

  // Główna logika wysyłania danych do Firebase
  const handleSubmit = async () => {
    setErrorMessage(null); // Reset błędu na starcie

    // 1. Podstawowa walidacja pól lokalnych (po angielsku)
    if (!email.trim() || !password.trim() || (!isLogin && !username.trim())) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGOWANIE ---
        await signInWithEmailAndPassword(auth, email.trim(), password);
        console.log('Logged in successfully!');

      } else {
        // --- REJESTRACJA ---
        const cleanUsername = username.trim();

        // KROK A: Sprawdzenie czy username (login) jest już zajęty w Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', cleanUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setErrorMessage('This username is already taken.');
          setLoading(false);
          return;
        }

        // KROK B: Tworzenie konta w usłudze Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        // KROK C: Zapis profilu w bazie Firestore
        await setDoc(doc(db, 'users', user.uid), {
          username: cleanUsername,
          email: email.trim(),
          created_at: new Date().toISOString(),
          role: 'user',
        });

        console.log('Account created successfully!');
      }
    } catch (error: any) {
      console.error('Firebase Auth Error:', error.code);

      // 2. Mapowanie błędów systemowych Firebase na język angielski
      switch (error.code) {
        // Błędy rejestracji
        case 'auth/email-already-in-use':
          setErrorMessage('An account with this email address already exists.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('The email address provided is invalid.');
          break;
        case 'auth/weak-password':
          setErrorMessage('The password is too weak. Please choose a stronger one.');
          break;

        // Błędy logowania
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setErrorMessage('Invalid email or password. Please try again.');
          break;

        // Błędy techniczne
        case 'auth/too-many-requests':
          setErrorMessage('Too many unsuccessful attempts. Please try again later.');
          break;
        default:
          setErrorMessage('An unexpected error occurred. Please try again.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <View style={styles.headerSide} />
        <ThemedText style={styles.logo}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TŁO - ŁAPY */}
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

        {/* TYTUŁ SEKCJI */}
        <Text style={styles.mainTitle}>{isLogin ? 'Welcome back' : 'Create account'}</Text>

        {/* FORMULARZ WEJŚCIOWY */}
        <View style={styles.formContainer}>

          {/* Pole Username */}
          {!isLogin && (
            <View style={styles.inputWrapper}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-outline" size={24} color="white" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#A0A0A0"
                value={username}
                onChangeText={(text) => { setUsername(text); setErrorMessage(null); }}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          )}

          {/* Pole Email */}
          <View style={styles.inputWrapper}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={24} color="white" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#A0A0A0"
              value={email}
              onChangeText={(text) => { setEmail(text); setErrorMessage(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Pole Password */}
          <View style={styles.inputWrapper}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="white" />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A0A0A0"
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); setErrorMessage(null); }}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* KOMUNIKAT O BŁĘDZIE PO ANGIELSKU */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color="#D32F2F" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* GŁÓWNY PRZYCISK ZATWIERDZENIA */}
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* LINK PRZEŁĄCZAJĄCY LOGOWANIE / REJESTRACJĘ */}
        <TouchableOpacity style={styles.switchBtn} onPress={toggleAuthMode} disabled={loading}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <Text style={styles.switchTextBold}>{isLogin ? 'Sign up' : 'Log in'}</Text>
          </Text>
        </TouchableOpacity>

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
    paddingBottom: 100,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 40,
    marginBottom: 40,
    color: '#000',
    textAlign: 'center',
  },
  formContainer: {
    width: width * 0.85,
  },
  inputWrapper: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  iconContainer: {
    backgroundColor: '#E99664',
    padding: 10,
    borderRadius: 15,
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    paddingVertical: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 15,
    marginTop: 5,
    marginBottom: 10,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },
  primaryBtn: {
    backgroundColor: '#E99664',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#E99664',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '600',
  },
  switchBtn: {
    marginTop: 30,
    padding: 15,
  },
  switchText: {
    fontSize: 16,
    color: '#707070',
  },
  switchTextBold: {
    color: '#E99664',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default AuthScreen;
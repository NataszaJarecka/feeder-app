import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';

import { loginUser, registerNewUser } from '../../services/userService';

const { width } = Dimensions.get('window');

const AuthScreen = () => {
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];
  const theme = currentTheme;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setUsername('');
    setErrorMessage(null);
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!email.trim() || !password.trim() || (!isLogin && !username.trim())) {
      setErrorMessage('Proszę wypełnić wszytskie wymagane pola.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Hasło musi składać się z conajmniej 6 znaków.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
        console.log('Pomyślnie zalogowano!');
      } else {
        await registerNewUser(email, password, username);
        console.log('Pomyślnie stworzono konto!');
      }
    } catch (error: any) {
      console.error('Auth Error:', error.message || error.code);

      if (error.message === 'USERNAME_TAKEN') {
        setErrorMessage('Wybrana nazwa użytkownika jest już zajęta.');
      } else {
        switch (error.code) {
                    case 'auth/email-already-in-use':
            setErrorMessage('Konto o podanym adresie e-mail juz istnieje.');
            break;
                    case 'auth/invalid-email':
            setErrorMessage('Niepoprawny adres e-mail.');
            break;
                    case 'auth/weak-password':
            setErrorMessage('Wybrane hasło jest za słabe. Proszę wybrać silniejsze.');
            break;
                    case 'auth/invalid-credential':
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setErrorMessage('Niepoprawny e-mail lub hasło. Spróbuj ponownie.');
            break;
                    case 'auth/too-many-requests':
            setErrorMessage('Za dużo nieudanych prób logowania. Spróbuj ponownie później.');
            break;
                    default:
            setErrorMessage('Wystąpił nieoczekiany błąd. Spróbuj ponownie póżniej');
            break;
        }
      }
    } finally {
      setLoading(false);
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
        <View style={styles.headerSide} />
        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={theme === 'dark' ? '#FFF' : undefined} />

        <Text style={[styles.mainTitle, { color: currentColors.text }]}>
          {isLogin ? 'Witaj' : 'Stwórz konto'}
        </Text>

        <View style={styles.formContainer}>
          {!isLogin && (
            <View style={[styles.inputWrapper, { backgroundColor: theme === 'dark' ? '#26292B' : '#FFF' }]}>
              <View style={styles.iconContainer}>
                <Ionicons name="person-outline" size={24} color="white" />
              </View>
              <TextInput
                style={[styles.input, { color: currentColors.text }]}
                placeholder="Nazwa użytkownika"
                placeholderTextColor={theme === 'dark' ? '#7A7A7A' : '#A0A0A0'}
                value={username}
                onChangeText={(text) => { setUsername(text); setErrorMessage(null); }}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          )}

          <View style={[styles.inputWrapper, { backgroundColor: theme === 'dark' ? '#26292B' : '#FFF' }]}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={24} color="white" />
            </View>
            <TextInput
              style={[styles.input, { color: currentColors.text }]}
              placeholder="Adres e-mail"
              placeholderTextColor={theme === 'dark' ? '#7A7A7A' : '#A0A0A0'}
              value={email}
              onChangeText={(text) => { setEmail(text); setErrorMessage(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputWrapper, { backgroundColor: theme === 'dark' ? '#26292B' : '#FFF' }]}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed-outline" size={24} color="white" />
            </View>
            <TextInput
              style={[styles.input, { color: currentColors.text }]}
              placeholder="Hasło"
              placeholderTextColor={theme === 'dark' ? '#7A7A7A' : '#A0A0A0'}
              secureTextEntry
              value={password}
              onChangeText={(text) => { setPassword(text); setErrorMessage(null); }}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {errorMessage && (
            <View style={[styles.errorBox, { backgroundColor: theme === 'dark' ? '#3D1A1A' : '#FFEBEE' }]}>
              <Ionicons name="alert-circle-outline" size={20} color={theme === 'dark' ? '#FF6B6B' : '#D32F2F'} />
              <Text style={[styles.errorText, { color: theme === 'dark' ? '#FF6B6B' : '#D32F2F' }]}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Ładowanie...' : (isLogin ? 'Zaloguj się' : 'Zarejestruj się')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.switchBtn} onPress={toggleAuthMode} disabled={loading}>
          <Text style={[styles.switchText, { color: theme === 'dark' ? '#A0A0A0' : '#707070' }]}>
            {isLogin ? "Nie masz jeszcze konta? " : "Masz już konto? "}
            <Text style={styles.switchTextBold}>{isLogin ? 'Zarejestruj się' : 'Zaloguj się'}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    justifyContent: 'center'
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center'
  },
  bgPaw: { position: 'absolute', width: 200, height: 200, opacity: 0.6, zIndex: -1 },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  scrollContent: { alignItems: 'center', paddingBottom: 100 },
  mainTitle: { fontSize: 42, fontWeight: '400', marginTop: 40, marginBottom: 40, textAlign: 'center' },
  formContainer: { width: width * 0.85 },
  inputWrapper: {
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
    elevation: 5
  },
  iconContainer: { backgroundColor: '#E99664', padding: 10, borderRadius: 15, marginRight: 15 },
  input: { flex: 1, fontSize: 18, paddingVertical: 10 },
  errorBox: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 15, marginTop: 5, marginBottom: 10 },
  errorText: { fontSize: 14, fontWeight: '500', marginLeft: 10, flex: 1 },
  primaryBtn: { backgroundColor: '#E99664', borderRadius: 25, paddingVertical: 15, alignItems: 'center', marginTop: 15, shadowColor: '#E99664', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#FFF', fontSize: 22, fontWeight: '600' },
  switchBtn: { marginTop: 30, padding: 15 },
  switchText: { fontSize: 16 },
  switchTextBold: { color: '#E99664', fontWeight: 'bold', textDecorationLine: 'underline' },
});

export default AuthScreen;
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'; // <-- ZAPEWNIONY IMPORT DLA ZWYKŁEGO TEXT
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

// IMPORT IMAGE PICKERA
import * as ImagePicker from 'expo-image-picker';

// IMPORTY SERWISU
import { deleteUserAccount, updateUserProfile } from '../../services/userService';

const { width } = Dimensions.get('window');

const EditProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // STAN DLA PEŁNEGO OBIEKTU PLIKU (ZGODNIE Z ARCHITEKTURĄ SUPABASE)
  const [imageFile, setImageFile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // STANY KONTROLNE UI
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Funkcja otwierająca galerię/pliki systemowe
  const pickImage = async () => {
    // Prośba o uprawnienia do galerii
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Tylko zdjęcia
      allowsEditing: true,    // Pozwól użytkownikowi przyciąć w kwadrat
      aspect: [1, 1],
      quality: 0.7,           // Optymalna kompresja jakości
    });

    if (!result.canceled) {
      // Zapisujemy cały obiekt pliku ze wszystkimi potrzebnymi metadanymi dla Supabase
      setImageFile({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || `profile_${Date.now()}.jpg`,
        type: result.assets[0].mimeType || 'image/jpeg'
      });
    }
  };

  // Logika zapisu zmian
  const handleSave = async () => {
    setError('');

    if (showPasswordForm) {
      if (!password.trim()) {
        setError('Password cannot be empty');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Password confirmation does not match');
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Najpierw wykonujemy asynchroniczny zapis do baz (Supabase + Firebase)
      await updateUserProfile(
        showPasswordForm ? password : undefined,
        imageFile ? imageFile : undefined
      );

      // 2. Po sukcesie wyświetlamy komunikat, a po kliknięciu OK wykonujemy kolejne akcje
      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Przenosimy użytkownika na ekran profilu i całkowicie go odświeżamy
            router.replace('/my_account');
          }
        }
      ]);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Please log out and log back in to change your password.');
      } else {
        setError('Could not update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Logika usuwania konta
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you absolutely sure? This will permanently delete your profile data and authentication account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteUserAccount();
            } catch (err: any) {
              console.error(err);
              if (err.code === 'auth/requires-recent-login') {
                Alert.alert("Security Check", "This action requires recent authentication. Please log out, log back in, and try again.");
              } else {
                Alert.alert("Error", "Could not delete account. Try again.");
              }
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* HEADER */}
      <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
        <TouchableOpacity onPress={() => router.replace('/my_account')} style={styles.headerSideLeft}>
          <Ionicons name="chevron-back" size={24} color="#000" />
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

        {/* POPRAWIONO: ZWYKŁY <Text> IDENTYCZNIE JAK NA EKRANIE SETTINGS, SCHEDULE, PETS I LANGUAGE */}
        <Text style={styles.title}>Edit Profile</Text>

        <View style={styles.form}>

          {/* SEKCJA WYBORU ZDJĘCIA */}
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Profile Photo</ThemedText>

            <View style={styles.photoPickerRow}>
              {/* Podgląd wybranego zdjęcia za pomocą imageFile.uri */}
              <View style={styles.photoPreviewBox}>
                {imageFile?.uri ? (
                  <Image source={{ uri: imageFile.uri }} style={styles.previewImage} />
                ) : (
                  <Ionicons name="person" size={40} color="#A0A0A0" />
                )}
              </View>

              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.7} disabled={loading}>
                <Ionicons name="image-outline" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.uploadBtnText}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* EDYCJA HASŁA */}
          {!showPasswordForm ? (
            <TouchableOpacity style={styles.changePasswordButton} onPress={() => setShowPasswordForm(true)} activeOpacity={0.8} disabled={loading}>
              <Text style={styles.changePasswordButtonText}>Change password</Text>
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>New password</ThemedText>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  style={styles.input}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>Confirm password</ThemedText>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  style={styles.input}
                  editable={!loading}
                />
              </View>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* PRZYCISK ZAPISU */}
          <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.6 }]} onPress={handleSave} activeOpacity={0.8} disabled={loading}>
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : (showPasswordForm ? 'Save Changes' : 'Done')}
            </Text>
          </TouchableOpacity>

          {/* DROBNY, BEZPIECZNY LINK DO USUNIĘCIA KONTA NA SAMYM DOLE */}
          <TouchableOpacity style={styles.deleteAccountLink} onPress={handleDeleteAccount} activeOpacity={0.7} disabled={loading}>
            <Text style={styles.deleteAccountLinkText}>Permanently delete account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 15, paddingHorizontal: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 4 },
  headerSide: { width: 32, alignItems: 'flex-end' },
  headerSideLeft: { width: 32, justifyContent: 'center', alignItems: 'flex-start' },
  logo: { fontSize: 32, fontWeight: 'bold', fontStyle: 'italic' },
  bgPaw: { position: 'absolute', width: 200, height: 200, opacity: 0.6, zIndex: -1 },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  // ZSYNCHRONIZOWANE Z USTAWIENIAMI: alignItems: 'center' ratuje duże czcionki przed ucinaniem brzegów
  scrollContent: { alignItems: 'center', paddingTop: 20, paddingBottom: 60 },
  // IDENTYCZNE PARAMETRY JAK mainTitle W SETTINGS SCREEN
  title: { fontSize: 42, fontWeight: '400', marginTop: 30, marginBottom: 20, color: '#000', textAlign: 'center' },
  form: { width: '100%', maxWidth: width * 0.85, alignItems: 'center' },
  inputGroup: { width: '100%', marginBottom: 25 },
  inputLabel: { fontSize: 16, marginBottom: 10, color: '#333', fontWeight: '500' },
  input: { width: '100%', backgroundColor: '#F8F8F8', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#111' },
  changePasswordButton: { width: '100%', backgroundColor: '#E99664', paddingVertical: 16, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  changePasswordButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorText: { width: '100%', marginBottom: 16, color: '#D94747', textAlign: 'center' },
  saveButton: { width: '100%', backgroundColor: '#E99664', paddingVertical: 16, borderRadius: 25, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },

  // STYLE DLA SEKCJI WYBORU ZDJĘCIA (FOTO-PICKER)
  photoTextLink: { color: '#E99664', fontSize: 16, fontWeight: '600' },
  photoPickerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F8F8', padding: 12, borderRadius: 18 },
  photoPreviewBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#EAEAEA', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  uploadBtn: { backgroundColor: '#E99664', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 15, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  uploadBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },

  // STYLIZACJE DLA DROBNEGO LINKU USUWANIA KONTA
  deleteAccountLink: {
    marginTop: 45,
    padding: 10,
  },
  deleteAccountLinkText: {
    color: '#A0A0A0',
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '400',
  },
});

export default EditProfileScreen;
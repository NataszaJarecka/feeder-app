import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/Colors';
import { useAppTheme } from '../../context/ThemeContext';

// IMPORT IMAGE PICKER
import * as ImagePicker from 'expo-image-picker';

// IMPORTY SERWISU
import { deleteUserAccount, updateUserProfile } from '../../services/userService';

const { width } = Dimensions.get('window');

const EditProfileScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { currentTheme } = useAppTheme();
  const currentColors = Colors[currentTheme];

  const [imageFile, setImageFile] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission Required", "You need to allow access to your photos to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageFile({
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || `profile_${Date.now()}.jpg`,
        type: result.assets[0].mimeType || 'image/jpeg'
      });
    }
  };

  const handleCancelPassword = () => {
    setShowPasswordForm(false);
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

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
      await updateUserProfile(
        showPasswordForm ? password : undefined,
        imageFile ? imageFile : undefined
      );

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => {
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
    <ThemedView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[
        styles.header,
        {
          paddingTop: insets.top + 15,
          backgroundColor: currentTheme === 'dark' ? '#1E2123' : '#FFFFFF',
          shadowColor: currentTheme === 'dark' ? '#FFFFFF' : '#000000',
          shadowOpacity: currentTheme === 'dark' ? 0.35 : 0.12,
          shadowOffset: { width: 0, height: 3 },
          shadowRadius: currentTheme === 'dark' ? 5 : 4,
          elevation: currentTheme === 'dark' ? 10 : 4,
        }
      ]}>
        <TouchableOpacity onPress={() => router.replace('/my_account')} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={28} color={currentColors.text} />
        </TouchableOpacity>

        <ThemedText style={[styles.logo, { color: currentColors.text }]}>iFeeder</ThemedText>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" tintColor={currentTheme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" tintColor={currentTheme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" tintColor={currentTheme === 'dark' ? '#FFF' : undefined} />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" tintColor={currentTheme === 'dark' ? '#FFF' : undefined} />

        <Text style={[styles.title, { color: currentColors.text }]}>Edit Profile</Text>

        <View style={styles.form}>

          {/* SEKCJA 1: ZDJĘCIE PROFILOWE */}
          <View style={styles.inputGroup}>
            <ThemedText style={[styles.inputLabel, { color: currentColors.text }]}>Profile Photo</ThemedText>

            <View style={[styles.photoPickerRow, { backgroundColor: currentTheme === 'dark' ? '#26292B' : '#F8F8F8' }]}>
              <View style={[styles.photoPreviewBox, { backgroundColor: currentTheme === 'dark' ? '#1E2123' : '#EAEAEA' }]}>
                {imageFile?.uri ? (
                  <Image source={{ uri: imageFile.uri }} style={styles.previewImage} />
                ) : (
                  <Ionicons name="person" size={40} color={currentTheme === 'dark' ? '#555' : '#A0A0A0'} />
                )}
              </View>

              <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.7} disabled={loading}>
                <Ionicons name="image-outline" size={20} color={currentTheme === 'dark' ? '#FFFFFF' : 'white'} style={{ marginRight: 8 }} />
                {/* Wymuszony biały kolor tekstu w dark modzie */}
                <Text style={[styles.uploadBtnText, { color: currentTheme === 'dark' ? '#FFFFFF' : 'white' }]}>Choose Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SEKCJA 2: ZMIANA HASŁA */}
          <View style={styles.passwordSectionContainer}>
            {!showPasswordForm ? (
              <TouchableOpacity style={styles.changePasswordButton} onPress={() => setShowPasswordForm(true)} activeOpacity={0.8} disabled={loading}>
                <Text style={styles.changePasswordButtonText}>Change password</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.passwordFormFields, { borderColor: currentTheme === 'dark' ? '#333' : '#EEE' }]}>
                {/* Usunięto tekst Security Preference, został sam przycisk Cancel wyrównany do prawej */}
                <View style={styles.passwordHeaderRow}>
                  <TouchableOpacity onPress={handleCancelPassword} style={styles.cancelPasswordBtn}>
                    <Text style={styles.cancelPasswordBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <ThemedText style={[styles.inputLabel, { color: currentColors.text }]}>New password</ThemedText>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={currentTheme === 'dark' ? '#7A7A7A' : '#999'}
                    secureTextEntry
                    style={[styles.input, { backgroundColor: currentTheme === 'dark' ? '#26292B' : '#F8F8F8', color: currentColors.text }]}
                    editable={!loading}
                  />
                </View>

                <View style={[styles.inputGroup, { marginBottom: 5 }]}>
                  <ThemedText style={[styles.inputLabel, { color: currentColors.text }]}>Confirm password</ThemedText>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={currentTheme === 'dark' ? '#7A7A7A' : '#999'}
                    secureTextEntry
                    style={[styles.input, { backgroundColor: currentTheme === 'dark' ? '#26292B' : '#F8F8F8', color: currentColors.text }]}
                    editable={!loading}
                  />
                </View>
              </View>
            )}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* PRZYCISK ZAPISU KOŃCOWEGO */}
          <TouchableOpacity style={[styles.saveButton, loading && { opacity: 0.6 }]} onPress={handleSave} activeOpacity={0.8} disabled={loading}>
            <Text style={styles.saveButtonText}>
              {loading ? 'Saving...' : (showPasswordForm ? 'Save Changes' : 'Done')}
            </Text>
          </TouchableOpacity>

          {/* LINK DO USUNIĘCIA KONTA */}
          <TouchableOpacity style={styles.deleteAccountLink} onPress={handleDeleteAccount} activeOpacity={0.7} disabled={loading}>
            <Text style={[styles.deleteAccountLinkText, { color: currentTheme === 'dark' ? '#7A7A7A' : '#A0A0A0' }]}>
              Permanently delete account
            </Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'center',
  },
  bgPaw: { position: 'absolute', width: 200, height: 200, opacity: 0.6, zIndex: -1 },
  pawTopRight: { top: 10, right: 20, transform: [{ rotate: '15deg' }] },
  pawMidLeft: { top: 250, left: 20, transform: [{ rotate: '-10deg' }] },
  pawMidRight: { top: 500, right: 30, transform: [{ rotate: '5deg' }] },
  pawBottomLeft: { top: 750, left: 20, transform: [{ rotate: '-20deg' }] },
  scrollContent: { alignItems: 'center', paddingTop: 20, paddingBottom: 60 },
  title: { fontSize: 42, fontWeight: '400', marginTop: 30, marginBottom: 20, textAlign: 'center' },
  form: { width: '100%', maxWidth: width * 0.85, alignItems: 'center' },
  inputGroup: { width: '100%', marginBottom: 25 },
  inputLabel: { fontSize: 16, marginBottom: 10, fontWeight: '500' },
  input: { width: '100%', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  passwordSectionContainer: { width: '100%', marginBottom: 25 },
  passwordFormFields: { width: '100%', borderWidth: 1, borderRadius: 25, padding: 16, borderStyle: 'dashed' },
  // Zmiana justifyContent na flex-end, żeby przycisk Cancel uciekł na prawą stronę po usunięciu tekstu
  passwordHeaderRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 },
  cancelPasswordBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  cancelPasswordBtnText: { color: '#D94747', fontSize: 15, fontWeight: '600' },
  changePasswordButton: { width: '100%', backgroundColor: '#E99664', paddingVertical: 16, borderRadius: 25, alignItems: 'center' },
  changePasswordButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorText: { width: '100%', marginBottom: 16, color: '#D94747', textAlign: 'center' },
  saveButton: { width: '100%', backgroundColor: '#E99664', paddingVertical: 16, borderRadius: 25, alignItems: 'center' },
  saveButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },

  photoPickerRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18 },
  photoPreviewBox: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  uploadBtn: { backgroundColor: '#E99664', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 15, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  uploadBtnText: { color: 'white', fontSize: 14, fontWeight: '600' },

  deleteAccountLink: {
    marginTop: 45,
    padding: 10,
  },
  deleteAccountLinkText: {
    fontSize: 13,
    textDecorationLine: 'underline',
    fontWeight: '400',
  },
});

export default EditProfileScreen;
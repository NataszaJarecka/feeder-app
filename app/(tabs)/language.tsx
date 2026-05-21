import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';

const { width } = Dimensions.get('window');

const languages = [
  { id: 'en', label: 'English' },
  { id: 'pl', label: 'Polish / Polski' },
];

const LanguageScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  return (
      <ThemedView style={styles.container}>
           <View style={[styles.header, { paddingTop: insets.top + 15 }]}>
             <TouchableOpacity onPress={() => router.push('/settings')} style={styles.headerSideLeft}>
               <Ionicons name="arrow-back" size={28} color="#000" />
             </TouchableOpacity>
             <ThemedText style={styles.logo}>iFeeder</ThemedText>
             <View style={styles.headerSide} />
           </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawTopRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidLeft]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawMidRight]} resizeMode="contain" />
        <Image source={require('@/assets/images/paw-pattern.png')} style={[styles.bgPaw, styles.pawBottomLeft]} resizeMode="contain" />

        <ThemedText style={styles.title}>Language</ThemedText>

        <View style={styles.languageList}>
          {languages.map((language) => {
            const active = selectedLanguage === language.id;
            return (
              <TouchableOpacity
                key={language.id}
                style={[styles.languageCard, active && styles.languageCardActive]}
                onPress={() => setSelectedLanguage(language.id)}
                activeOpacity={0.8}
              >
                <View style={styles.languageInfo}>
                  <ThemedText style={[styles.languageLabel, active && styles.languageLabelActive]}>{language.label}</ThemedText>
                  {active && <Text style={styles.languageSelected}>Selected</Text>}
                </View>
                {active && <Ionicons name="checkmark-circle" size={24} color="#E99664" />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={() => router.push('/settings')}>
          <Text style={styles.saveButtonText}>Save language</Text>
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
    alignItems: 'flex-end',
  },
  headerSideLeft: {
    width: 32,
    justifyContent: 'center',
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
    paddingTop: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 42,
    fontWeight: '400',
    marginTop: 30,
    marginBottom: 20,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  languageList: {
    width: '100%',
    maxWidth: width * 0.85,
    alignSelf: 'center',
  },
  languageCard: {
    backgroundColor: '#F8F8F8',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 80,
  },
  languageCardActive: {
    backgroundColor: '#FFF3EA',
    borderColor: '#E99664',
  },
  languageInfo: {
    flexDirection: 'column',
    flex: 1,
    marginRight: 12,
  },
  languageLabel: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
    flexShrink: 1,
  },
  languageLabelActive: {
    color: '#E99664',
  },
  languageSelected: {
    marginTop: 4,
    fontSize: 14,
    color: '#687076',
  },
  saveButton: {
    marginTop: 20,
    backgroundColor: '#E99664',
    width: width * 0.85,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LanguageScreen;

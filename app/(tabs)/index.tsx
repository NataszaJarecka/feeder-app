// import { Ionicons } from '@expo/vector-icons'; // Używamy domyślnej biblioteki ikon Expo
// import { useRouter } from 'expo-router';
// import React from 'react';
// import { Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

// // Importujemy Twoje "themed" komponenty, aby zachować spójność
// import { ThemedText } from '../../components/themed-text';
// import { ThemedView } from '../../components/themed-view';

// // --- MINIKOMPONENTY (Dla czystości kodu) ---

// // Komponent dla przycisków akcji
// const ActionButton = ({ title, onPress }: { title: string; onPress?: () => void }) => (
//   <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
//     <ThemedText style={styles.actionButtonText} type="defaultSemiBold">
//       {title}
//     </ThemedText>
//   </TouchableOpacity>
// );

// // Komponent dla elementów dolnego paska (Tab Bar)
// const TabBarItem = ({ iconName, label, active }: { iconName: string; label: string; active?: boolean }) => (
//   <TouchableOpacity style={[styles.tabItem, active && styles.activeTab]}>
//     <Ionicons name={iconName as any} size={28} color={active ? '#FF8C42' : '#777'} />
//     <ThemedText style={[styles.tabLabel, active && styles.activeTabLabel]} type="default">
//       {label}
//     </ThemedText>
//   </TouchableOpacity>
// );

// // --- GŁÓWNY EKRAN ---

// export default function PetProfileScreen() {
//   const router = useRouter();

//   return (
//     <ThemedView style={styles.screenContainer}>

//       {/* 1. GÓRNY PASEK (HEADER) */}
//       <View style={styles.headerBar}>
//         {/* Przezroczysty placeholder po lewej dla balansu */}
//         <View style={{ width: 40 }} />
//         <ThemedText type="subtitle" style={styles.brandTitle}>iFeeder</ThemedText>
//         <TouchableOpacity style={styles.iconWrapper}>
//           <Ionicons name="notifications" size={26} color="black" />
//         </TouchableOpacity>
//       </View>

//     { /* 2. GŁÓWNY OBSZAR TREŚCI} */}

//     <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

//   {/* --- NOWE, PRECYZYJNE UŁOŻENIE ŁAP W ZYGZAK --- */}
//   {/* 1. Łapa góra-prawa */}
//   <Image
//     source={require('@/assets/images/paw-pattern.png')} // Dostosuj ścieżkę
//     style={[styles.singlePaw, styles.pawTopRight]}
//     resizeMode="contain"
//   />

//   {/* 2. Łapa środek-lewa */}
//   <Image
//     source={require('@/assets/images/paw-pattern.png')}
//     style={[styles.singlePaw, styles.pawMidLeft]}
//     resizeMode="contain"
//   />

//   {/* 3. Łapa środek-prawa */}
//   <Image
//     source={require('@/assets/images/paw-pattern.png')}
//     style={[styles.singlePaw, styles.pawMidRight]}
//     resizeMode="contain"
//   />

//   {/* 4. Łapa dół-lewa */}
//   <Image
//     source={require('@/assets/images/paw-pattern.png')}
//     style={[styles.singlePaw, styles.pawBottomLeft]}
//     resizeMode="contain"
//   />


//         {/* TYTUŁ SEKCJ */}
//         <View style={styles.sectionTitleRow}>
//           <ThemedText type="title" style={styles.sectionTitle}>Pet's profile</ThemedText>
//           <TouchableOpacity style={styles.iconWrapper}>
//             <Ionicons name="pencil-outline" size={26} color="#777" />
//           </TouchableOpacity>
//         </View>

//         {/* ZDJĘCIE PSA */}
//         <View style={styles.photoContainer}>
//           <Image
//             // Wstaw tutaj ścieżkę do swojego zdjęcia psa
//             source={require('@/assets/images/dog-photo.jpg')} // Dostosuj ścieżkę
//             style={styles.profilePhoto}
//           />
//         </View>

//         {/* DANE PSA */}
//         <View style={styles.petInfo}>
//           <ThemedText type="title" style={styles.petName}>Hans</ThemedText>
//           <ThemedText style={styles.petDescription} type="default">Blue collar</ThemedText>
//         </View>

//         {/* PRZYCISKI AKCJI */}
//         <View style={styles.actionButtonsContainer}>
//           <ActionButton title="Feeding schedule" onPress={() => router.push('/schedule')} />
//           <ActionButton title="Feeding statistics" />
//         </View>

//       </ScrollView>


//     </ThemedView>
//   );
// }

// // --- STYLIZACJA (StyleSheet) ---

// const styles = StyleSheet.create({
//   // Ekran główny i ogólny układ
//   screenContainer: {
//     flex: 1,
//     paddingTop: Platform.OS === 'android' ? 30 : 0, // Drobny padding dla Androida
//   },
//   scrollContent: {
//     paddingHorizontal: 20,
//     paddingBottom: 100, // Zostaw miejsce na dolny pasek
//   },

//   // Górny pasek (Header)
//   headerBar: {
//     height: 70,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     paddingHorizontal: 15,
//   },
//   brandTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     fontStyle: 'italic',
//   },

//  singlePaw: {
//   position: 'absolute',
//   width: 200, // Standardowa wielkość
//   height: 200,
//   opacity: 0.5, // Subtelne tło
// },

// // Precyzyjne pozycje:

// // 1. Łapa góra-prawa
// pawTopRight: {
//   top: 10,
//   right: 20,
//   transform: [{ rotate: '15deg' }],
// },

// // 2. Łapa środek-lewa
// pawMidLeft: {
//   top: 250, // Zjeżdżamy niżej
//   left: 20,
//   width: 200, // Nieco większa
//   height: 200,
//   transform: [{ rotate: '-10deg' }],
// },

// // 3. Łapa środek-prawa
// pawMidRight: {
//   top: 500, // Jeszcze niżej
//   right: 30,
//   transform: [{ rotate: '5deg' }],
// },

// // 4. Łapa dół-lewa
// pawBottomLeft: {
//   top: 750, // Nad dolnym paskiem
//   left: 20,
//   width: 200, // Nieco mniejsza
//   height: 200,
//   transform: [{ rotate: '-20deg' }],
// },

//   // Tytuł sekcji
//   sectionTitleRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginTop: 30,
//     marginBottom: 20,
//   },
//   sectionTitle: {
//     fontSize: 32,
//     marginRight: 10,
//   },

//   // Zdjęcie psa
//   photoContainer: {
//     alignItems: 'center',
//     marginVertical: 15,
//   },
//   profilePhoto: {
//     width: 150,
//     height: 150,
//     borderRadius: 75, // Tworzy koło
//     borderWidth: 1,
//     borderColor: '#eee',
//   },

//   // Dane psa
//   petInfo: {
//     alignItems: 'center',
//     marginBottom: 30,
//   },
//   petName: {
//     fontSize: 36,
//   },
//   petDescription: {
//     color: '#777',
//     fontSize: 16,
//     marginTop: 5,
//   },

//   // Przyciski akcji
//   actionButtonsContainer: {
//     alignItems: 'center',
//     gap: 15, // Odstęp między przyciskami (wymaga nowszych wersji RN)
//   },
//   actionButton: {
//     backgroundColor: '#E99664', // Kolor pomarańczowy z obrazka
//     paddingVertical: 15,
//     paddingHorizontal: 30,
//     borderRadius: 30,
//     minWidth: '80%',
//     alignItems: 'center',
//     // Cień
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.3,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 5,
//       },
//     }),
//   },
//   actionButtonText: {
//     color: 'white',
//     fontSize: 18,
//   },

//   // Dolny pasek nawigacji (Tab Bar)
//   tabBar: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 90,
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingBottom: 15, // Miejsce na pasek domowy iOS
//     paddingTop: 10,
//     backgroundColor: 'white',
//     // Cień dolnego paska
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -3 },
//         shadowOpacity: 0.1,
//         shadowRadius: 5,
//       },
//       android: {
//         elevation: 10,
//       },
//     }),
//   },
//   tabItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   tabLabel: {
//     marginTop: 4,
//     color: '#777',
//   },
//   iconWrapper: {
//     padding: 5,
//   },
//   activeTab: {
//     // Możesz dodać tło lub ramkę dla aktywnego tabu, jeśli chcesz
//   },
//   activeTabLabel: {
//     color: '#FF8C42',
//     fontWeight: 'bold',
//   },


// });

import { Redirect } from 'expo-router';

export default function Index() {
  // Przekierowuje użytkownika od razu na ścieżkę /pets
  return <Redirect href="/pets" />;
}
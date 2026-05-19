import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // TUTAJ WKLEJ SWOJE DANE KONFIGURACYJNE Z FIREBASE CONSOLE:


  apiKey: "AIzaSyCa37HujbIoBE4WdGdq-cK2oSMibJmTOnY",

  authDomain: "feeder-app-a3940.firebaseapp.com",

  projectId: "feeder-app-a3940",

  storageBucket: "feeder-app-a3940.firebasestorage.app",

  messagingSenderId: "799086203205",

  appId: "1:799086203205:web:c1837a8d86c6061eae6e2c",

  measurementId: "G-YX1XGFCYLD"

};

// 1. Zabezpieczenie przed SSR: Jeśli środowisko to serwer (brak obiektu window),
// stwórz pusty obiekt, aby Expo się nie wywaliło podczas budowania.
const isServer = typeof window === 'undefined';

let app;
let db;

if (!isServer) {
  // Kod wykona się tylko na telefonie / w przeglądarce klienta
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Bezpieczna inicjalizacja Firestore dla Expo
  db = initializeFirestore(app, {
    experimentalAutoDetectPersistence: true
  });
} else {
  // Atrapy obiektów dla serwera, żeby importy w innych plikach nie zwracały błędu
  app = {};
  db = {};
}

export { app, db };

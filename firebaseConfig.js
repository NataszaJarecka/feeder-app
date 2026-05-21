import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
// 1. Zamiast initializeAuth i persistence, używamy po prostu getAuth
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCa37HujbIoBE4WdGdq-cK2oSMibJmTOnY",
  authDomain: "feeder-app-a3940.firebaseapp.com",
  projectId: "feeder-app-a3940",
  storageBucket: "feeder-app-a3940.firebasestorage.app",
  messagingSenderId: "799086203205",
  appId: "1:799086203205:web:c1837a8d86c6061eae6e2c",
  measurementId: "G-YX1XGFCYLD"
};

const isServer = typeof window === 'undefined';

let app;
let db;
let auth;

if (!isServer) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  db = initializeFirestore(app, {
    experimentalAutoDetectPersistence: true
  });

  // 2. Prosta inicjalizacja. Firebase sam dobierze najlepszy mechanizm zapisu sesji.
  auth = getAuth(app);
} else {
  app = {};
  db = {};
  auth = {};
}

export { app, auth, db };

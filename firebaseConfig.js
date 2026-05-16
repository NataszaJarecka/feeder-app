import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCa37HujbIoBE4WdGdq-cK2oSMibJmTOnY",
  authDomain: "feeder-app-a3940.firebaseapp.com",
  projectId: "feeder-app-a3940",
  storageBucket: "feeder-app-a3940.firebasestorage.app",
  messagingSenderId: "799086203205",
  appId: "1:799086203205:web:c1837a8d86c6061eae6e2c",
  measurementId: "G-YX1XGFCYLD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const analytics = getAnalytics(app);
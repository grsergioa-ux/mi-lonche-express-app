// src/firebase.js

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2aBYmIjW-_LSG8jPtdEwatz6pgSDyNnk",
  authDomain: "lunch-app-47261.firebaseapp.com",
  projectId: "lunch-app-47261",
  storageBucket: "lunch-app-47261.firebasestorage.app",
  messagingSenderId: "726676315181",
  appId: "1:726676315181:web:f20e19edfaf396f3592ca4"
};

// Evita múltiples inicializaciones
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db = getFirestore(app);
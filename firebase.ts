// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCETIIk_cOGA9Rrt6WkwO104n4-cdvvbow",
  authDomain: "intelliconn-20938.firebaseapp.com",
  projectId: "intelliconn-20938",
  storageBucket: "intelliconn-20938.firebasestorage.app",
  messagingSenderId: "2756105278",
  appId: "1:2756105278:web:01184099cb5a9bfed82d6f",
  measurementId: "G-GCL7STZWYY",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);

// Use persistence only on web
if (Platform.OS === "web") {
  setPersistence(auth, browserLocalPersistence);
}

// Firestore
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

// 🔥 IMPORTANT — Functions with region
const functions = getFunctions(app, "asia-southeast1");

// Analytics (Web Only)
let analytics: any = null;

if (Platform.OS === "web") {
  import("firebase/analytics")
    .then(({ getAnalytics }) => {
      analytics = getAnalytics(app);
    })
    .catch(() => {
      // Analytics not available
    });
}

// ✅ Export AFTER everything is defined
export { analytics, app, auth, db, functions, storage };


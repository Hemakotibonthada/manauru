/**
 * Firebase Configuration for Mana Uru
 * Enterprise-level configuration with security and error handling
 */

import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBrRenhABh93uibH2ApJSFAz8ICYMyp4Yc",
  authDomain: "mana-uru-001.firebaseapp.com",
  projectId: "mana-uru-001",
  storageBucket: "mana-uru-001.firebasestorage.app",
  messagingSenderId: "693249416656",
  appId: "1:693249416656:web:a383e02cdc99ed5ebcadd5",
  measurementId: "G-Z4NNJQ8HTD"
};

// Initialize Firebase only once
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

try {
  // Check if Firebase has already been initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
  } else {
    app = getApps()[0];
    console.log('✅ Firebase already initialized');
  }

  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Analytics only works on web
  if (Platform.OS === 'web') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw new Error('Failed to initialize Firebase');
}

// Export initialized services
export { app, auth, db, storage, analytics };

// Export Firebase config for reference
export { firebaseConfig };

// Helper function to check if Firebase is initialized
export const isFirebaseInitialized = (): boolean => {
  return getApps().length > 0;
};

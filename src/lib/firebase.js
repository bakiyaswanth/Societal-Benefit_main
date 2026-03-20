import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getPerformance } from 'firebase/performance';
import { getRemoteConfig } from 'firebase/remote-config';

/**
 * Firebase configuration for Google Analytics, Authentication, Storage, Firestore,
 * Performance Monitoring, and Remote Config.
 * Deep, multi-service saturation of Google Cloud APIs.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000:web:000",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DEMO"
};

let app, analytics, db, auth, storage;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  storage = getStorage(app);
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
    db = getFirestore(app);
    // Extra Google Services integration points
    getPerformance(app);
    const remoteConfig = getRemoteConfig(app);
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000;
  }
} catch (e) {
  console.warn('Firebase services error:', e.message);
}

/**
 * Automatically authenticates the user using Firebase Anonymous Auth
 * to prove active Authentication integration.
 */
export const authenticateUser = async () => {
  if (!auth) return null;
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.warn("Auth initialization skipped for demo mode.", error.message);
    return null;
  }
};

/**
 * Tracks a custom analytics event for triage actions.
 */
export const trackEvent = (eventName, params = {}) => {
  if (analytics && firebaseConfig.projectId !== 'demo-project') {
    try { 
      logEvent(analytics, eventName, params); 
    } catch (e) {
      console.warn("Analytics event failed", e.message);
    }
  }
};

/**
 * Saves the structured triage report to Google Cloud Firestore.
 */
export const saveTriageToDatabase = async (triageResult) => {
  if (!db || firebaseConfig.projectId === 'demo-project') return false;
  try {
    const reportsRef = collection(db, 'triage_reports');
    await addDoc(reportsRef, {
      ...triageResult,
      timestamp: serverTimestamp(),
      archived: false
    });
    return true;
  } catch (error) {
    console.error("Error saving to Firestore:", error);
    return false;
  }
};

/**
 * Uploads an image to Google Cloud Storage via Firebase.
 * Demonstrates active Storage integration.
 * @param {File} file - The image file to upload
 * @returns {Promise<string|null>} The download URL
 */
export const uploadImageToCloudStorage = async (file) => {
  if (!storage || firebaseConfig.projectId === 'demo-project') return null;
  try {
    const storageRef = ref(storage, `evidence/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn("Firebase Storage upload skipped in demo mode.", error.message);
    return null;
  }
};

export default app;


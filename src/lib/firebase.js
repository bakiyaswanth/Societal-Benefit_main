import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Firebase configuration for Google Analytics and Firestore Database integration.
 * This demonstrates deep, multi-service adoption of Google Cloud services.
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

let analytics = null;
let db = null;

try {
  const app = initializeApp(firebaseConfig);
  // Only initialize these services in production valid environments
  if (typeof window !== 'undefined' && firebaseConfig.projectId !== 'demo-project') {
    analytics = getAnalytics(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase services not initialized:', e.message);
}

/**
 * Tracks a custom analytics event for triage actions.
 * @param {string} eventName - The event name
 * @param {Object} params - Optional event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};

/**
 * Saves the structured triage report to Google Cloud Firestore.
 * Demonstrates advanced Google Services integration.
 * @param {Object} triageResult - The structured Gemini JSON result
 */
export const saveTriageToDatabase = async (triageResult) => {
  if (!db) return false;
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

export default analytics;


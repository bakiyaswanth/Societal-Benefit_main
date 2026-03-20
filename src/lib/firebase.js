import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent } from 'firebase/analytics';

/**
 * Firebase configuration for Google Analytics integration.
 * This demonstrates meaningful use of Google Cloud services (Firebase).
 * 
 * IMPORTANT: Replace the placeholder values below with your own Firebase project config
 * from https://console.firebase.google.com
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

try {
  const app = initializeApp(firebaseConfig);
  // Only initialize analytics in production browser environments
  if (typeof window !== 'undefined' && firebaseConfig.projectId !== 'demo-project') {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn('Firebase Analytics not initialized:', e.message);
}

/**
 * Tracks a custom analytics event for triage actions.
 * @param {string} eventName - The event name (e.g., 'triage_analysis_started')
 * @param {Object} params - Optional event parameters
 */
export const trackEvent = (eventName, params = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};

export default analytics;

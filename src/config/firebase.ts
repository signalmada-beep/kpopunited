// ========== src/config/firebase.ts ==========
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  browserSessionPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  browserPopupRedirectResolver 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// ============================================================
// ✅ FIREBASE CONFIG - Mampiasa env variables
// ============================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

// ============================================================
// INITIALIZE APP
// ============================================================
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ============================================================
// INITIALIZE AUTH
// ============================================================
const auth = getAuth(app);

// Ataovy maharitra ny session (tsy very rehefa mamerina ny page)
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('✅ Auth persistence set to local');
  })
  .catch((error) => {
    console.error('❌ Error setting auth persistence:', error);
  });

// ============================================================
// INITIALIZE FIRESTORE
// ============================================================
const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Enable offline persistence
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(firestore)
    .then(() => {
      console.log('✅ Firestore persistence enabled (multi-tab)');
    })
    .catch((error) => {
      if (error.code === 'failed-precondition') {
        console.warn('⚠️ Firestore persistence: Multiple tabs open, using single tab');
        enableIndexedDbPersistence(firestore)
          .then(() => {
            console.log('✅ Firestore persistence enabled (single tab)');
          })
          .catch((err) => {
            console.warn('⚠️ Firestore persistence not available:', err.message);
          });
      } else if (error.code === 'unimplemented') {
        console.warn('⚠️ Firestore persistence not supported in this browser');
      } else {
        console.error('❌ Firestore persistence error:', error);
      }
    });
}

// Network listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('✅ Network online');
  });
  window.addEventListener('offline', () => {
    console.warn('⚠️ Network offline');
  });
}

// ============================================================
// INITIALIZE STORAGE
// ============================================================
const storage = getStorage(app);

// ============================================================
// INITIALIZE REALTIME DATABASE
// ============================================================
const database = getDatabase(app);

// ============================================================
// EXPORTS
// ============================================================
export {
  app,
  auth,
  firestore,
  storage,
  database,
};

// ============================================================
// ANALYTICS UTILITY
// ============================================================
export const logAnalyticsEvent = (eventName: string, eventParams?: any) => {
  console.log(`📊 Analytics: ${eventName}`, eventParams || '');
};

// ============================================================
// NETWORK UTILITIES
// ============================================================
export const enableFirestoreNetwork = async () => {
  try {
    const { enableNetwork } = await import('firebase/firestore');
    await enableNetwork(firestore);
    console.log('✅ Firestore network enabled');
  } catch (error) {
    console.error('❌ Error enabling network:', error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    const { disableNetwork } = await import('firebase/firestore');
    await disableNetwork(firestore);
    console.log('✅ Firestore network disabled');
  } catch (error) {
    console.error('❌ Error disabling network:', error);
  }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================
export default {
  app,
  auth,
  firestore,
  storage,
  database,
  logAnalyticsEvent,
  enableFirestoreNetwork,
  disableFirestoreNetwork,
};
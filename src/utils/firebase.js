import { initializeApp, getApp, getApps } from 'firebase/app';
import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, getAuth, indexedDBLocalPersistence, initializeAuth } from 'firebase/auth';
import { cordovaPopupRedirectResolver } from 'firebase/auth/cordova';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const requiredKeys = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_APP_ID',
];

export const missingFirebaseKeys = requiredKeys.filter((key) => !process.env[key]);

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId
);

let app = null;
if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const isNativePlatform = Capacitor?.isNativePlatform?.() || false;

const createAuthInstance = (firebaseApp) => {
  if (!firebaseApp) {
    return null;
  }

  if (!isNativePlatform) {
    return getAuth(firebaseApp);
  }

  try {
    return initializeAuth(firebaseApp, {
      persistence: indexedDBLocalPersistence,
      popupRedirectResolver: cordovaPopupRedirectResolver,
    });
  } catch {
    return getAuth(firebaseApp);
  }
};

export const firebaseApp = app;
export const auth = createAuthInstance(app);
export const db = app ? getFirestore(app) : null;

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const firebaseStatusMessage = isFirebaseConfigured
  ? ''
  : `Firebase is not configured. Missing: ${missingFirebaseKeys.join(', ')}.`;
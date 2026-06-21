/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { auth, firebaseStatusMessage, googleProvider, isFirebaseConfigured } from '../utils/firebase';

const AuthContext = createContext(null);

const getAuthErrorMessage = (error) => {
  const code = error?.code || '';
  const errorMap = {
    'auth/unauthorized-domain': 'Domain not authorized. Add localhost and your Firebase domain to Auth > Settings > Authorized domains.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/operation-not-allowed': 'Google sign-in is disabled in Firebase provider settings.',
    'auth/popup-blocked': 'Popup was blocked. Allow popups and retry.',
    'auth/invalid-api-key': 'Invalid Firebase API key. Check REACT_APP_FIREBASE_* env vars.',
    'auth/internal-error': 'Firebase internal error. Verify config and try again.',
    'auth/invalid-cordova-configuration': 'Mobile configuration error. Updating app...',
    'auth/argument-error': 'Sign-in environment configuration mismatch. Retrying...',
  };
  const defaultMsg = code ? `Sign-in failed (${code})` : 'Sign-in failed. Please retry.';
  return errorMap[code] || defaultMsg;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setAuthMessage(firebaseStatusMessage || 'Firebase not configured. Sign-in required.');
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        if (!nextUser) {
          setAuthMessage('');
        }
      },
      () => {
        setLoading(false);
        setAuthMessage('Could not read sign-in state.');
      }
    );

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      setAuthMessage(firebaseStatusMessage || 'Google sign-in unavailable.');
      return false;
    }

    setAuthMessage('Signing in...');
    const isNative = Capacitor?.isNativePlatform?.() || false;

    try {
      if (isNative) {
        await signInWithRedirect(auth, googleProvider);
        return true;
      }

      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      console.error('Sign-in error:', error?.code, error?.message);

      if (!isNative) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return true;
        } catch (redirectError) {
          console.error('Redirect failed:', redirectError?.code);
          setAuthMessage(getAuthErrorMessage(redirectError));
          return false;
        }
      }

      setAuthMessage(getAuthErrorMessage(error));
      return false;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!auth) {
      setUser(null);
      return true;
    }
    await signOut(auth);
    return true;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authMessage,
      signInWithGoogle,
      signOutUser,
    }),
    [user, loading, authMessage, signInWithGoogle, signOutUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
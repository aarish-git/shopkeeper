/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { auth, firebaseStatusMessage, googleProvider, isFirebaseConfigured } from '../utils/firebase';

const AuthContext = createContext(null);
const OFFLINE_USER_FLAG = 'shopkeeper_offline_user';

const getOfflineUser = () => ({
  uid: 'offline-user',
  displayName: 'Offline User',
  isOffline: true,
});

const getFriendlyAuthMessage = (error) => {
  const code = error?.code || '';

  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Authentication settings.';
  }

  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completing login.';
  }

  if (code === 'auth/cancelled-popup-request') {
    return 'Another sign-in popup is already open.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error while contacting Google. Check internet connection and retry.';
  }

  if (code === 'auth/operation-not-allowed') {
    return 'Google sign-in is disabled in Firebase Authentication provider settings.';
  }

  if (code === 'auth/invalid-api-key') {
    return 'Invalid Firebase API key. Check your REACT_APP_FIREBASE_* values.';
  }

  return 'Google sign-in failed. Please try again.';
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    if (!auth) {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(OFFLINE_USER_FLAG, 'true');
      }

      setUser(getOfflineUser());
      setAuthMessage('Running in offline mode. Cloud sync is disabled.');

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
        setAuthMessage('Could not read the sign-in state.');
      }
    );

    return unsubscribe;
  }, []);

  const signInOffline = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(OFFLINE_USER_FLAG, 'true');
    }

    setUser(getOfflineUser());
    setAuthMessage('Running in offline mode. Cloud sync is disabled.');
    return true;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      setAuthMessage(firebaseStatusMessage || 'Google sign-in is unavailable. Continuing in offline mode.');
      return signInOffline();
    }

    setAuthMessage('');

    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return true;
        } catch (redirectError) {
          setAuthMessage(getFriendlyAuthMessage(redirectError));
          return false;
        }
      }

      setAuthMessage(getFriendlyAuthMessage(error));
      return false;
    }
  }, [signInOffline]);

  const signOutUser = useCallback(async () => {
    if (!auth) {
      signInOffline();
      return true;
    }

    await signOut(auth);
    return true;
  }, [signInOffline]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authMessage,
      signInWithGoogle,
      signInOffline,
      signOutUser,
    }),
    [user, loading, authMessage, signInWithGoogle, signInOffline, signOutUser]
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
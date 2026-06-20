/* eslint-disable react/prop-types */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth';
import { auth, firebaseStatusMessage, googleProvider, isFirebaseConfigured } from '../utils/firebase';

const AuthContext = createContext(null);

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

  if (code === 'auth/popup-blocked') {
    return 'Popup was blocked by the browser. Allow popups for this site and try again.';
  }

  if (code === 'auth/requests-from-referer-are-blocked') {
    return 'This domain is blocked by API key restrictions. Allow this domain in Google Cloud API key restrictions.';
  }

  if (code === 'auth/web-storage-unsupported') {
    return 'Browser storage is disabled, so sign-in cannot continue. Enable cookies/local storage and retry.';
  }

  if (code === 'auth/internal-error') {
    return 'Firebase auth internal error. Verify Firebase config, authorized domain, and provider settings.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Too many sign-in attempts. Please wait a few minutes and try again.';
  }

  return `Google sign-in failed. ${code ? `(${code})` : 'Please try again.'}`;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState('');

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setAuthMessage(firebaseStatusMessage || 'Firebase is not configured. Google sign-in is required to use this app.');
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

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      setAuthMessage(firebaseStatusMessage || 'Google sign-in is unavailable until Firebase is configured.');
      return false;
    }

    setAuthMessage('');

    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      // Log raw auth errors for easier debugging in browser console.
      // eslint-disable-next-line no-console
      console.error('Google sign-in popup failed', error);

      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return true;
        } catch (redirectError) {
          // eslint-disable-next-line no-console
          console.error('Google sign-in redirect failed', redirectError);
          setAuthMessage(getFriendlyAuthMessage(redirectError));
          return false;
        }
      }

      setAuthMessage(getFriendlyAuthMessage(error));
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
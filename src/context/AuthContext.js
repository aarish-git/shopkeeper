/* eslint-disable react/prop-types */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import {
  auth,
  firebaseStatusMessage,
  googleProvider,
  isFirebaseConfigured,
} from '../utils/firebase';

const AuthContext = createContext(null);

const isMobileBrowser = () => {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

const shouldFallbackToRedirect = (code) =>
  [
    'auth/popup-blocked',
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
    'auth/internal-error',
  ].includes(code);

const getAuthErrorMessage = (error) => {
  const code = String(error?.code || '');
  const errorMessage = error?.message || '';

  if (code === '10' || /^10(?::|\b)/.test(errorMessage)) {
    return "Google sign-in is not configured for this Android build. In Firebase, enable Google sign-in, register com.shopkeeper.app, add this APK signing certificate's SHA-1 and SHA-256 fingerprints, then download the updated google-services.json and rebuild.";
  }

  const errorMap = {
    'auth/unauthorized-domain':
      'Domain not authorized. Add your domain in Firebase Console > Authentication > Settings > Authorized domains.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/cancelled-popup-request': 'Another sign-in popup is already open.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'auth/operation-not-allowed':
      'This sign-in method is disabled in Firebase Authentication settings.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account was found for this email. Create an account or check the address.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists for this email. Sign in instead.',
    'auth/weak-password': 'Choose a password with at least 6 characters.',
    'auth/popup-blocked': 'Popup was blocked. Redirecting sign-in is recommended on mobile.',
    'auth/invalid-api-key':
      'Invalid Firebase API key. Check REACT_APP_FIREBASE_* env vars.',
    'auth/internal-error': 'Firebase internal error. Verify config and try again.',
    'auth/invalid-cordova-configuration':
      'Mobile configuration error. Check Firebase Android app, SHA-1/SHA-256, google-services.json and Capacitor sync.',
    'auth/argument-error':
      'Sign-in environment configuration mismatch. Check Firebase and Google OAuth configuration.',
    'auth/account-exists-with-different-credential':
      'An account already exists with the same email using another sign-in method.',
    canceled: 'Sign-in was canceled.',
  };

  const defaultMsg = code
    ? `Sign-in failed (${code})`
    : 'Sign-in failed. Please retry.';

  return errorMap[code] || errorMessage || defaultMsg;
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

    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
          setAuthMessage('');
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error?.code, error?.message);
        setAuthMessage(getAuthErrorMessage(error));
      });

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setLoading(false);
        setAuthMessage('');
      },
      () => {
        setLoading(false);
        setAuthMessage('Could not read sign-in state.');
      }
    );

    return unsubscribe;
  }, []);

  const signInNativeGoogle = useCallback(async () => {
    let result;
    try {
      result = await FirebaseAuthentication.signInWithGoogle();
    } catch (error) {
      if (!/no credentials available/i.test(error?.message || '')) {
        throw error;
      }

      result = await FirebaseAuthentication.signInWithGoogle({
        useCredentialManager: false,
      });
    }

    const idToken = result?.credential?.idToken || null;
    const accessToken = result?.credential?.accessToken || null;

    if (!idToken && !accessToken) {
      setAuthMessage('Google token not returned from native sign-in.');
      return false;
    }

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    await signInWithCredential(auth, credential);
    setAuthMessage('');
    return true;
  }, []);

  const signInWebGoogle = useCallback(async () => {
    if (isMobileBrowser()) {
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    await signInWithPopup(auth, googleProvider);
    setAuthMessage('');
  }, []);

  const signInWithFacebook = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      setAuthMessage(firebaseStatusMessage || 'Facebook sign-in unavailable.');
      return false;
    }

    setAuthMessage('Signing in with Facebook...');

    try {
      if (Capacitor.isNativePlatform()) {
        const result = await FirebaseAuthentication.signInWithFacebook();
        const accessToken = result?.credential?.accessToken || null;

        if (!accessToken) {
          throw new Error('Facebook did not return an access token.');
        }

        await signInWithCredential(
          auth,
          FacebookAuthProvider.credential(accessToken)
        );
      } else if (isMobileBrowser()) {
        await signInWithRedirect(auth, new FacebookAuthProvider());
        return true;
      } else {
        await signInWithPopup(auth, new FacebookAuthProvider());
      }

      setAuthMessage('');
      return true;
    } catch (error) {
      console.error('Facebook sign-in error:', error?.code, error?.message);
      setAuthMessage(getAuthErrorMessage(error));
      return false;
    }
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    if (!auth || !isFirebaseConfigured) {
      setAuthMessage(firebaseStatusMessage || 'Email sign-in unavailable.');
      return false;
    }

    setAuthMessage('Signing in...');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setAuthMessage('');
      return true;
    } catch (error) {
      console.error('Email sign-in error:', error?.code, error?.message);
      setAuthMessage(getAuthErrorMessage(error));
      return false;
    }
  }, []);

  const createEmailAccount = useCallback(async (email, password) => {
    if (!auth || !isFirebaseConfigured) {
      setAuthMessage(firebaseStatusMessage || 'Account creation unavailable.');
      return false;
    }

    setAuthMessage('Creating your account...');
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      setAuthMessage('');
      return true;
    } catch (error) {
      console.error('Email account creation error:', error?.code, error?.message);
      setAuthMessage(getAuthErrorMessage(error));
      return false;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!auth || !isFirebaseConfigured) {
      setAuthMessage(firebaseStatusMessage || 'Google sign-in unavailable.');
      return false;
    }

    setAuthMessage('Signing in...');

    const isNative = Capacitor.isNativePlatform();

    try {
      if (isNative) {
        return await signInNativeGoogle();
      }

      await signInWebGoogle();
      return true;
    } catch (error) {
      console.error('Sign-in error:', error?.code, error?.message);

      if (!isNative) {
        if (shouldFallbackToRedirect(error?.code)) {
          try {
            await signInWithRedirect(auth, googleProvider);
            return true;
          } catch (redirectError) {
            console.error('Redirect failed:', redirectError?.code, redirectError?.message);
            setAuthMessage(getAuthErrorMessage(redirectError));
            return false;
          }
        }
      }

      setAuthMessage(getAuthErrorMessage(error));
      return false;
    }
  }, [signInNativeGoogle, signInWebGoogle]);

  const signOutUser = useCallback(async () => {
    if (!auth) {
      setUser(null);
      return true;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        await FirebaseAuthentication.signOut();
      } catch (error) {
        console.warn('Native sign-out warning:', error?.message || error);
      }
    }

    await signOut(auth);
    setUser(null);
    setAuthMessage('');
    return true;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authMessage,
      signInWithGoogle,
      signInWithFacebook,
      signInWithEmail,
      createEmailAccount,
      signOutUser,
    }),
    [
      user,
      loading,
      authMessage,
      signInWithGoogle,
      signInWithFacebook,
      signInWithEmail,
      createEmailAccount,
      signOutUser,
    ]
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
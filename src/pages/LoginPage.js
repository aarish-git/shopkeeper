import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseStatusMessage, isFirebaseConfigured } from '../utils/firebase';
import './LoginPage.css';

function LoginPage() {
  const { authMessage, signInWithGoogle, signInOffline } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const onGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setSubmitting(false);
    }
  };

  const message = authMessage || firebaseStatusMessage;

  const onOfflineSignIn = () => {
    signInOffline();
  };

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-left">
          <div className="login-brand">
            <div className="login-badge">Shopkeeper</div>
            <h1>{isFirebaseConfigured ? 'Sign in with Google' : 'Continue in Offline Mode'}</h1>
            <p>
              {isFirebaseConfigured
                ? 'Use one account across phone and desktop. Your products, cart items, and sales stay synced.'
                : 'Cloud sync is optional. You can continue now and use the app without Firebase setup.'}
            </p>
          </div>

          <div className="login-benefits">
            <div className="benefit-item">
              <span>🔐</span>
              <div>
                <strong>Secure account access</strong>
                <p>Only your Google account can access your business data.</p>
              </div>
            </div>
            <div className="benefit-item">
              <span>☁️</span>
              <div>
                <strong>Cloud-first data</strong>
                <p>Firestore keeps your latest product, cart, and sales updates.</p>
              </div>
            </div>
            <div className="benefit-item">
              <span>📱</span>
              <div>
                <strong>Cross-device continuity</strong>
                <p>Log in on any device and continue from the same state.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-panel">
            <h2>Continue</h2>
            <p>{isFirebaseConfigured ? 'Authenticate with Google to enter the app.' : 'Enter the app now. No setup needed.'}</p>

            {message ? <p className="login-message">{message}</p> : null}

            {isFirebaseConfigured ? (
              <button type="button" className="login-btn" onClick={onGoogleSignIn} disabled={submitting}>
                {submitting ? 'Signing in...' : 'Continue with Google'}
              </button>
            ) : null}

            {isFirebaseConfigured ? null : (
              <button type="button" className="offline-btn" onClick={onOfflineSignIn}>
                Continue in Offline Mode
              </button>
            )}

            <div className="login-footnote">
              {isFirebaseConfigured ? (
                <p>Your Firebase configuration is detected.</p>
              ) : (
                <p>Firebase is not configured. This is fine for offline usage.</p>
              )}
            </div>

            {authMessage || firebaseStatusMessage ? <p className="missing-keys">{authMessage || firebaseStatusMessage}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
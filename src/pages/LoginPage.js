import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseStatusMessage, isFirebaseConfigured } from '../utils/firebase';
import './LoginPage.css';

function LoginPage() {
  const { authMessage, signInWithGoogle } = useAuth();
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

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-left">
          <div className="login-brand">
            <div className="login-badge">Shopkeeper</div>
            <h1>Sign in with Google</h1>
            <p>Login is required to use the app and keep your products, cart, and sales synced.</p>
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
            <p>Authenticate with Google to enter the app.</p>

            {message ? <p className="login-message">{message}</p> : null}

            <button type="button" className="login-btn" onClick={onGoogleSignIn} disabled={submitting || !isFirebaseConfigured}>
              {submitting ? 'Signing in...' : 'Continue with Google'}
            </button>

            {!isFirebaseConfigured ? (
              <p className="missing-keys">Firebase config is required before users can log in.</p>
            ) : null}

            <div className="login-footnote">
              {isFirebaseConfigured ? (
                <p>Firebase is configured and ready.</p>
              ) : (
                <p>Complete Firebase setup, then retry Google sign-in.</p>
              )}
            </div>

            {authMessage || firebaseStatusMessage ? (
              <p className="missing-keys">{authMessage || firebaseStatusMessage}</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
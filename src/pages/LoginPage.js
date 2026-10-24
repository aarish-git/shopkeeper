import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { firebaseStatusMessage, isFirebaseConfigured } from '../utils/firebase';
import './LoginPage.css';

function LoginPage() {
  const {
    authMessage,
    signInWithGoogle,
    signInWithFacebook,
    signInWithEmail,
    createEmailAccount,
  } = useAuth();
  const [submitting, setSubmitting] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSocialSignIn = async (provider, signIn) => {
    setSubmitting(provider);
    try {
      await signIn();
    } finally {
      setSubmitting('');
    }
  };

  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    setSubmitting('email');
    try {
      if (isCreatingAccount) {
        await createEmailAccount(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } finally {
      setSubmitting('');
    }
  };

  const isBusy = Boolean(submitting);

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-left">
          <div className="login-brand">
            <div className="login-badge">Shopkeeper</div>
            <h1>Sign in to Shopkeeper</h1>
            <p>Choose a sign-in method to access your products, cart, and sales.</p>
          </div>

          <div className="login-benefits">
            <div className="benefit-item">
              <span>🔐</span>
              <div>
                <strong>Secure account access</strong>
                <p>Only your signed-in account can access your business data.</p>
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
            <p>Use a provider or your email and password.</p>

            {authMessage || firebaseStatusMessage ? (
              <p className="login-message" role="status">
                {authMessage || firebaseStatusMessage}
              </p>
            ) : null}

            <button
              type="button"
              className="login-btn"
              onClick={() => handleSocialSignIn('google', signInWithGoogle)}
              disabled={isBusy || !isFirebaseConfigured}
            >
              {submitting === 'google' ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              type="button"
              className="login-btn login-btn-secondary"
              onClick={() => handleSocialSignIn('facebook', signInWithFacebook)}
              disabled={isBusy || !isFirebaseConfigured}
            >
              {submitting === 'facebook' ? 'Signing in...' : 'Continue with Facebook'}
            </button>

            <div className="login-divider"><span>or use email</span></div>

            <form className="login-form" onSubmit={handleEmailSubmit}>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isBusy || !isFirebaseConfigured}
              />

              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={isBusy || !isFirebaseConfigured}
              />

              <button
                type="submit"
                className="login-btn login-btn-email"
                disabled={isBusy || !isFirebaseConfigured}
              >
                {submitting === 'email'
                  ? 'Please wait...'
                  : isCreatingAccount
                    ? 'Create account with email'
                    : 'Sign in with email'}
              </button>
            </form>

            <button
              type="button"
              className="login-mode-toggle"
              onClick={() => setIsCreatingAccount((creating) => !creating)}
              disabled={isBusy || !isFirebaseConfigured}
            >
              {isCreatingAccount
                ? 'Already have an account? Sign in'
                : 'New here? Create an account'}
            </button>

            {!isFirebaseConfigured ? (
              <p className="login-footnote">Complete Firebase setup before signing in.</p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
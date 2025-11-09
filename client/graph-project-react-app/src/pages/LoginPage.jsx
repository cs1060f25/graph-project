// client/src/pages/LoginPage.jsx
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleLogo from '../google-logo-icon-gsuite-hd-701751694791470gzbayltphh.png';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, loginWithEmail, loginWithGoogle, error: authError, setError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (user && !loading) {
      // Redirect to queryPage - ProtectedRoute will handle new user redirect to /setup
      const redirectTo = (location.state && location.state.from) || '/queryPage';
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  const validate = () => {
    if (!email.trim()) return 'Please enter your email.';
    // Simple email pattern for client-side check
    const emailOk = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
    if (!emailOk) return 'Please enter a valid email address.';
    if (!password) return 'Please enter your password.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email.trim(), password);
      // onAuthStateChanged will handle redirect
    } catch (ex) {
      const message = ex.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : ex.message || 'Failed to sign in. Please try again.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setFormError('');
    setError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (ex) {
      setFormError('Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page" role="main">
      <header className="login-header" aria-label="App header">
        <h1 className="brand">Graphene</h1>
      </header>

      <main className="login-main">
        <section className="login-card" aria-labelledby="login-title">
          <h2 id="login-title" className="login-title">Sign in</h2>
          <p className="login-subtitle">Access your saved graphs and papers</p>

          <form className="login-form" onSubmit={onSubmit} noValidate aria-describedby={formError || authError ? 'form-error' : undefined}>
            {(formError || authError) && (
              <div id="form-error" className="form-error" role="alert">
                {formError || authError}
              </div>
            )}

            <div className="field">
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-required="true"
                disabled={submitting || loading}
              />
            </div>

            <div className="field">
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-required="true"
                disabled={submitting || loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || loading}
              aria-busy={submitting || loading}
            >
              {(submitting || loading) ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="divider" role="separator" aria-label="or" />

          <button
            type="button"
            className="btn btn-google"
            onClick={onGoogle}
            disabled={submitting || loading}
          >
            <span aria-hidden style={{ display: 'inline-flex', marginRight: 8 }}>
              <img src={googleLogo} alt="" width={18} height={18} style={{ display: 'block' }} />
            </span>
            Sign in with Google
          </button>

          <nav className="aux-links" aria-label="Secondary">
            <Link to="/signup" className="link">Create account</Link>
          </nav>
        </section>
      </main>
    </div>
  );
}



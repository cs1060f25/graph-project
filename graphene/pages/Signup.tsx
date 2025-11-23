'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/contexts/AuthContext';
import '../styles/LoginPage.css';

export default function Signup() {
  const router = useRouter();
  const { user, loading, signUpWithEmail, signOut } = useAuth();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  useEffect(() => {
    if (user && !loading) {
      router.replace('/query');
    }
  }, [user, loading, router]);

  const validate = (): string => {
    if (!name.trim()) return 'Please enter your name.';
    if (!email.trim()) return 'Please enter your email.';
    const emailOk = /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email);
    if (!emailOk) return 'Please enter a valid email address.';
    if (!password) return 'Please enter a password.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirm) return 'Passwords do not match.';
    return '';
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    setSubmitting(true);
    try {
      await signUpWithEmail(email.trim(), password);
      // onAuthStateChanged will handle redirect
    } catch (ex: any) {
      const message = ex.code === 'auth/email-already-in-use'
        ? 'This email is already registered. Please sign in instead.'
        : ex.code === 'auth/weak-password'
        ? 'Password is too weak. Please choose a stronger password.'
        : ex.message || 'Failed to create account. Please try again.';
      setFormError(message);
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
        <section className="login-card" aria-labelledby="signup-title">
          <h2 id="signup-title" className="login-title">Create account</h2>
          <p className="login-subtitle">Join to save graphs and papers</p>

          <form className="login-form" onSubmit={onSubmit} noValidate aria-describedby={formError ? 'signup-error' : undefined}>
            {formError && (
              <div id="signup-error" className="form-error" role="alert">
                {formError}
              </div>
            )}

            <div className="field">
              <label htmlFor="name" className="label">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-required="true"
                disabled={submitting || loading}
              />
            </div>

            <div className="field">
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
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
                autoComplete="new-password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-required="true"
                disabled={submitting || loading}
              />
            </div>

            <div className="field">
              <label htmlFor="confirm" className="label">Confirm password</label>
              <input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                className="input"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
              {(submitting || loading) ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <nav className="aux-links" aria-label="Secondary">
            <span>Already have an account?</span>
            <Link href="/login" className="link">Sign in</Link>
          </nav>
        </section>
      </main>
    </div>
  );
}



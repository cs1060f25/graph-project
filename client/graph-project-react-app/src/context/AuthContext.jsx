// client/src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

// tiny helper to POST JSON and return parsed JSON or throw with status text
async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // no credentials unless your backend uses cookies; bootstrap expects JSON body
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* ignore */ }
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || text || res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);    // Firebase user
  const [token, setToken] = useState(null);  // Firebase ID token
  const [role, setRole] = useState(null);    // backend role (optional)
  const [loading, setLoading] = useState(true);

  // POST { token } → /api/auth/bootstrap
  const bootstrapAuthWithBackend = async (idToken) => {
    if (!idToken) throw new Error('No token to bootstrap');
    const data = await postJson(`${API_BASE_URL}/api/auth/bootstrap`, { token: idToken });
    // Expecting shape: { email, role, displayName }
    setRole(data?.role ?? 'user');
    return data;
  };

  // First load: track auth state
  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth is not configured');
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          setUser(currentUser);
          // getIdToken() refreshes if needed
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          try {
            await bootstrapAuthWithBackend(idToken);
          } catch (e) {
            // Don’t block the app: fall back to a default role
            console.error('Error bootstrapping auth with backend:', e);
            setRole('user');
          }
        } else {
          setUser(null);
          setToken(null);
          setRole(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // Also listen for token refreshes (hourly or manual)
  useEffect(() => {
    if (!auth) return;
    const unsub = onIdTokenChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setToken(null);
        setRole(null);
        return;
      }
      try {
        const idToken = await currentUser.getIdToken();
        setToken(idToken);
        // Re-bootstrap to refresh role/session server-side; non-fatal if it fails
        try {
          await bootstrapAuthWithBackend(idToken);
        } catch (e) {
          console.warn('Re-bootstrap failed (token change):', e);
          // keep existing role or default
          setRole((r) => r ?? 'user');
        }
      } catch (e) {
        console.error('Error refreshing ID token:', e);
        setToken(null);
      }
    });
    return () => unsub();
  }, []);

  // Auth actions
  const signInWithGoogle = async () => {
    if (!auth) throw new Error('Firebase is not configured');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    // popup “Cross-Origin-Opener-Policy would block window.close” warnings are harmless in dev
  };

  const signInWithEmail = async (email, password) => {
    if (!auth) throw new Error('Firebase is not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email, password) => {
    if (!auth) throw new Error('Firebase is not configured');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (!auth) {
      setUser(null); setToken(null); setRole(null);
      return;
    }
    await firebaseSignOut(auth);
    setUser(null); setToken(null); setRole(null);
  };

  const value = useMemo(() => ({
    user,
    token,
    role,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  }), [user, token, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

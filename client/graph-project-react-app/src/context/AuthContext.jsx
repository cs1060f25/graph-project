// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, googleProvider } from '../services/firebaseClient';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithEmail = async (email, password) => {
    setError(null);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    setError(null);
    return signInWithPopup(auth, googleProvider);
  };

  // DEMO: client-only login to bypass Firebase during UI development
  const loginDemo = async (email = 'demo@user.local') => {
    setUser({
      uid: 'demo-user',
      email,
      displayName: 'Demo User',
      providerData: [{ providerId: 'password' }],
    });
  };

  const logout = async () => {
    setError(null);
    await signOut(auth);
  };

  const value = useMemo(
    () => ({ user, loading, error, setError, loginWithEmail, loginWithGoogle, loginDemo, logout }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}



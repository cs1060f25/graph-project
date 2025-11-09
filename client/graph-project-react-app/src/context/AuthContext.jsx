// client/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, googleProvider } from '../services/firebaseClient';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { syncUserToFirestore } from '../services/userService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync user data to Firestore
        try {
          const { isNewUser: newUser, error: syncError } = await syncUserToFirestore(firebaseUser);
          if (syncError) {
            console.error('[AuthContext] Failed to sync user:', syncError);
            setError(`Failed to sync user data: ${syncError}`);
          } else {
            setIsNewUser(newUser);
            setError(null);
          }
        } catch (err) {
          console.error('[AuthContext] Error in auth state change:', err);
          setError('Failed to initialize user session');
        }
      } else {
        setIsNewUser(false);
        setError(null);
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const loginWithEmail = async (email, password) => {
    setError(null);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      // User sync happens in onAuthStateChanged
      return userCred;
    } catch (err) {
      const errorMsg = err.code === 'auth/invalid-credential' 
        ? 'Invalid email or password'
        : err.message || 'Failed to sign in';
      setError(errorMsg);
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      // User sync happens in onAuthStateChanged
      return userCred;
    } catch (err) {
      const errorMsg = err.message || 'Failed to sign in with Google';
      setError(errorMsg);
      throw err;
    }
  };

  const signUpWithEmail = async (email, password, additionalData = {}) => {
    setError(null);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      // Sync with additional data (e.g., name)
      await syncUserToFirestore(userCred.user, additionalData);
      return userCred;
    } catch (err) {
      const errorMsg = err.code === 'auth/email-already-in-use'
        ? 'This email is already registered'
        : err.message || 'Failed to create account';
      setError(errorMsg);
      throw err;
    }
  };

  // DEMO: client-only login to bypass Firebase (for development/testing)
  const loginDemo = async (email = 'demo@user.local') => {
    setUser({
      uid: 'demo-user',
      email,
      displayName: 'Demo User',
      providerData: [{ providerId: 'password' }],
    });
    setIsNewUser(false);
    setError(null);
  };

  const logout = async () => {
    setError(null);
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      
      // Clear all local storage (Firebase tokens, cached user data)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageErr) {
        console.warn('[AuthContext] Failed to clear storage:', storageErr);
        // Continue even if storage clear fails
      }
      
      // Reset state (onAuthStateChanged will also set user to null, but this ensures immediate update)
      setIsNewUser(false);
      setUser(null);
      
      console.log('[AuthContext] Successfully logged out');
    } catch (err) {
      console.error('[AuthContext] Logout error:', err);
      
      // Fallback: clear local state even if signOut fails (offline case)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageErr) {
        console.warn('[AuthContext] Failed to clear storage on error:', storageErr);
      }
      
      setIsNewUser(false);
      setUser(null);
      
      // If we're offline or signOut fails, still reset state but show warning
      const errorMsg = err.message?.includes('network') || navigator.onLine === false
        ? 'Logged out locally (offline)'
        : 'Failed to sign out from server, but local session cleared';
      
      setError(errorMsg);
      // Don't throw - we've cleared local state, user should still be logged out locally
    }
  };

  const value = useMemo(
    () => ({ 
      user, 
      loading, 
      error, 
      isNewUser,
      setError, 
      loginWithEmail, 
      loginWithGoogle, 
      signUpWithEmail,
      loginDemo, 
      logout 
    }),
    [user, loading, error, isNewUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}



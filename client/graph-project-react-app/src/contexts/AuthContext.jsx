// client/src/contexts/AuthContext.jsx
// Consolidated AuthContext - single source of truth for authentication

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { auth, googleProvider } from '../services/firebaseClient';
import { 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { syncUser } from '../services/userApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // If Firebase is not configured, just set loading to false
    if (!auth) {
      console.warn('Firebase auth is not configured');
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Get ID token for backend API calls
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          
          // Sync user data to Firestore via backend API (returns role and isNewUser)
          const { isNewUser: newUser, role: userRole, error: syncError } = await syncUser(idToken);
          if (syncError) {
            console.error('[AuthContext] Failed to sync user:', syncError);
            setError(`Failed to sync user data: ${syncError}`);
            setRole('user'); // Fallback role
          } else {
            setRole(userRole || 'user');
            setIsNewUser(newUser);
            setError(null);
          }
        } catch (err) {
          console.error('[AuthContext] Error getting ID token or syncing with backend:', err);
          setToken(null);
          setRole('user'); // Fallback role
          setError('Failed to initialize user session');
        }
      } else {
        setUser(null);
        setToken(null);
        setRole(null);
        setIsNewUser(false);
        setError(null);
      }
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
      // Sync with additional data (e.g., name) via backend API
      try {
        const idToken = await userCred.user.getIdToken();
        await syncUser(idToken, additionalData);
      } catch (syncErr) {
        console.error('[AuthContext] Failed to sync user on signup:', syncErr);
        // Don't fail signup if sync fails - user is still created
      }
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
    setToken(null);
    setRole('user');
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
      setToken(null);
      setRole(null);
      
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
      setToken(null);
      setRole(null);
      
      // If we're offline or signOut fails, still reset state but show warning
      const errorMsg = err.message?.includes('network') || navigator.onLine === false
        ? 'Logged out locally (offline)'
        : 'Failed to sign out from server, but local session cleared';
      
      setError(errorMsg);
      // Don't throw - we've cleared local state, user should still be logged out locally
    }
  };

  // Legacy method names for compatibility (map to new names)
  const signInWithEmail = loginWithEmail;
  const signInWithGoogle = loginWithGoogle;

  const value = useMemo(
    () => ({ 
    user,
    token,
    role,
    loading,
      error, 
      isNewUser,
      setError, 
      loginWithEmail, 
      loginWithGoogle, 
      signUpWithEmail,
      loginDemo, 
      logout,
      // Legacy method names for compatibility
      signInWithEmail,
    signInWithGoogle,
      signOut: logout,
    }),
    [user, token, role, loading, error, isNewUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

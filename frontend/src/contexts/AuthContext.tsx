'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut, Auth } from 'firebase/auth';
import { auth } from '../lib/firebase/client';
import { bootstrapAuth } from '../lib/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth is not configured');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth as Auth, async (currentUser: User | null) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          
          // Set httpOnly cookie for middleware
          try {
            await fetch('/api/auth/session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ token: idToken }),
            });
          } catch (cookieError) {
            console.error('Error setting auth cookie via session API:', cookieError);
          }
          
          // Call backend to bootstrap auth and get user role
          try {
            const userData = await bootstrapAuth(idToken);
            setRole((userData as any).role || 'user');
          } catch (error) {
            console.error('Error bootstrapping auth with backend:', error);
            setRole('user'); // Fallback role
          }
        } catch (error) {
          console.error('Error getting ID token:', error);
          setToken(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setToken(null);
        setRole(null);
        
        // Clear auth cookie on sign-out
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (cookieError) {
          console.error('Error clearing auth cookie on sign-out:', cookieError);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase is not configured');
    }
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth as Auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase is not configured');
    }
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    try {
      await signInWithEmailAndPassword(auth as Auth, email, password);
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase is not configured');
    }
    const { createUserWithEmailAndPassword } = await import('firebase/auth');
    try {
      await createUserWithEmailAndPassword(auth as Auth, email, password);
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) {
      setUser(null);
      setToken(null);
      setRole(null);
      try {
        await fetch('/api/auth/session', { method: 'DELETE' });
      } catch (cookieError) {
        console.error('Error clearing auth cookie on sign-out (no auth):', cookieError);
      }
      return;
    }
    try {
      await firebaseSignOut(auth as Auth);
      setUser(null);
      setToken(null);
      setRole(null);
      
      // Clear auth cookie
      try {
        await fetch('/api/auth/session', { method: 'DELETE' });
      } catch (cookieError) {
        console.error('Error clearing auth cookie on sign-out:', cookieError);
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      user,
      token,
      role,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [user, token, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithPopup, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiClient } from '../api';
import { setTokenGetter } from '../services/userApi';

interface AuthContextValue {
  user: FirebaseUser | null;
  token: string | null;
  role: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTokenGetter(() => token);
  }, [token]);

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth is not configured');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          
          try {
            const userData = await apiClient('/auth/bootstrap', {
              method: 'POST',
              body: JSON.stringify({ token: idToken }),
            });
            setRole(userData.role || 'user');
          } catch (error) {
            console.error('Error bootstrapping auth with backend:', error);
            setRole('user');
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    if (!auth) throw new Error('Firebase is not configured');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    if (!auth) throw new Error('Firebase is not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string): Promise<void> => {
    if (!auth) throw new Error('Firebase is not configured');
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signOut = async (): Promise<void> => {
    if (!auth) {
      setUser(null);
      setToken(null);
      setRole(null);
      return;
    }
    await firebaseSignOut(auth);
    setUser(null);
    setToken(null);
    setRole(null);
  };

  const value: AuthContextValue = {
    user,
    token,
    role,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

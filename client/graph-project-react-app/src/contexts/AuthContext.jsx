import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { apiClient } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured, just set loading to false
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
          
          // Call backend to bootstrap auth and get user role
          try {
            const userData = await apiClient('/api/auth/bootstrap', {
              method: 'POST',
              body: JSON.stringify({ token: idToken }),
            });
            setRole(userData.role || 'user');
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
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase is not configured');
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!auth) {
      setUser(null);
      setToken(null);
      setRole(null);
      return;
    }
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      setRole(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    role,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


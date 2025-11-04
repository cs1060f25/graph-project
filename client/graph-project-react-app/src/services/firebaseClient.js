// client/src/services/firebaseClient.js
// Firebase client initialization for Auth and Firestore

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use environment variables or fallback to server config values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDI6jt4aI8gqF2BdVt2a0b5uzgjq7b3Wrc",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "graphene-3b05a.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "graphene-3b05a",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "graphene-3b05a.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "355128430723",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:355128430723:web:f54f883525ba6491f1cbb6",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;



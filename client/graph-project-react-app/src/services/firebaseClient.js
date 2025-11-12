// client/src/services/firebaseClient.js
// Firebase client initialization for Auth and Firestore

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Use environment variables or fallback to demo values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.REACT_APP_FIREBASE_APP_ID || '1:123456789:web:demo',
};

// Warn if environment variables are not loaded
if (!process.env.REACT_APP_FIREBASE_API_KEY) {
  console.warn(
    'Firebase environment variables not found. ' +
    'Please create a .env file in client/graph-project-react-app/ with REACT_APP_FIREBASE_* variables. ' +
    'See README.md for setup instructions. ' +
    'Note: You must restart the dev server after creating/modifying .env files.'
  );
}

// Initialize Firebase with error handling
let app;
let auth;
let db;
let googleProvider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.warn('Firebase is not properly configured. Please check your .env file.');
  // Set to null so components can check for Firebase availability
  auth = null;
  db = null;
  googleProvider = null;
}

export { auth, db, googleProvider };
export default app;



import 'server-only';
import admin from './firebase-admin';

function getFirestore() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
  }
  return admin.firestore();
}

function getAuth() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
  }
  return admin.auth();
}

export const db = getFirestore();
export const auth = getAuth();


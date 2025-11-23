import 'server-only';
import admin from './firebase-admin';

let _db: admin.firestore.Firestore | null = null;
let _auth: admin.auth.Auth | null = null;

function getFirestore(): admin.firestore.Firestore {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
  }
  if (!_db) {
    _db = admin.firestore();
  }
  return _db;
}

function getAuth(): admin.auth.Auth {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized. Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set.');
  }
  if (!_auth) {
    _auth = admin.auth();
  }
  return _auth;
}

export const db = getFirestore();
export const auth = getAuth();


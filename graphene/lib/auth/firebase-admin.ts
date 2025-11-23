import 'server-only';
import admin from 'firebase-admin';
import { config } from '../config';

if (!admin.apps.length) {
  try {
    if (!config.firebase.projectId || !config.firebase.clientEmail || !config.firebase.privateKey) {
      throw new Error('Missing Firebase configuration. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
    }

    if (!config.firebase.privateKey.includes('BEGIN PRIVATE KEY')) {
      throw new Error('Invalid private key format. Private key must be in PEM format.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.message || error);
    throw error;
  }
}

export default admin;


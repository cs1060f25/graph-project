// server/services/users/config/firebaseConfig.js
// Use Firebase Admin SDK for server-side operations
import admin from '../../../config/firebase-admin.js';

// Export Firestore instance from Admin SDK
export const db = admin.firestore();
export const auth = admin.auth();
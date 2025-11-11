import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with service account
// Priority: 1. Environment variable, 2. serviceAccountKey.json file, 3. Application default credentials
let serviceAccount = null;

// Try environment variable first
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT from environment:', error);
  }
}

// Try loading from serviceAccountKey.json file
if (!serviceAccount) {
  try {
    const serviceAccountPath = join(__dirname, '../../serviceAccountKey.json');
    const serviceAccountData = readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(serviceAccountData);
    console.log('Loaded Firebase service account from serviceAccountKey.json');
  } catch (error) {
    console.warn('Could not load serviceAccountKey.json:', error.message);
    console.warn('Falling back to application default credentials');
  }
}

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized with service account');
  } else {
    // Fallback to using application default credentials
    admin.initializeApp();
    console.log('Firebase Admin initialized with application default credentials');
  }
}

export default admin;


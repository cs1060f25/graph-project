const admin = require('firebase-admin');

// Initialize Firebase Admin with service account or environment variables
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : null;

if (!admin.apps.length) {
  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Fallback to using application default credentials
    admin.initializeApp();
  }
}

module.exports = admin;


// server/routes/middleware/auth.js
// Note: This file appears to be unused. The main auth middleware is in server/middleware/auth.js
// If you need to use this file, import admin from '../config/firebase-admin.js' instead
import admin from '../../config/firebase-admin.js';

// Firebase Admin is already initialized in firebase-admin.js
// No need to initialize here - just use the admin instance

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'No authorization token provided' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};
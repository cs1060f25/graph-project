import express from 'express';
import admin from '../config/firebase-admin.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/auth/bootstrap
// Verifies Firebase ID token and upserts user
router.post('/bootstrap', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    // Upsert user in the database
    const user = await User.upsert({
      id: uid,
      email: email || '',
      displayName: name || '',
    });

    // Return user info with role
    res.json({
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// POST /api/auth/sync
// Syncs user data to Firestore (replaces frontend userService.js)
router.post('/sync', async (req, res) => {
  try {
    const { token, additionalData = {} } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false,
        isNewUser: false,
        error: 'Token is required' 
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    // Check if user already exists
    const existingUser = await User.findById(uid);
    const isNewUser = !existingUser;

    // Upsert user in the database with additional data
    const user = await User.upsert({
      id: uid,
      email: email || additionalData.email || '',
      displayName: additionalData.name || name || '',
    });

    res.json({
      success: true,
      isNewUser,
      error: null
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(401).json({ 
      success: false,
      isNewUser: false,
      error: error.message || 'Invalid token' 
    });
  }
});

export default router;


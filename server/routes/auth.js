const express = require('express');
const router = express.Router();
const admin = require('../config/firebase-admin');
const User = require('../models/User');

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

module.exports = router;


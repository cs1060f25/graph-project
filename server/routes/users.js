const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/me
// Returns current user info (requires authentication)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await User.findById(uid);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


import express from 'express';
import { auth } from '../../config/firebase.js';
import { getUser, createUser } from '../../services/db_service.js';
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
        const decodedToken = await auth.verifyIdToken(token);
        const { uid, email } = decodedToken;
        // Check if user exists, create if not
        let user = await getUser(uid);
        if (!user) {
            user = await createUser(uid, email || '');
        }
        // Return user info
        res.json({
            id: user.id,
            email: user.email,
            preferences: user.preferences || {},
        });
    }
    catch (error) {
        console.error('Error in bootstrap:', error);
        res.status(401).json({
            error: 'Invalid token',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=auth.js.map
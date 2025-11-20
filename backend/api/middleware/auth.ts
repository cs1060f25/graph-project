import { Request, Response, NextFunction } from 'express';
import { auth } from '../../config/firebase.js';

// Middleware to verify Firebase ID token
export const verifyFirebaseToken = async (
  req: Request & { user?: any; uid?: string },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authorization header missing or invalid' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    
    req.user = decodedToken;
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};


import 'server-only';
import admin from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken> {
  if (!token) {
    throw new Error('Authorization token is missing.');
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid or expired token.');
  }
}


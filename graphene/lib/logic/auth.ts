import { verifyFirebaseToken } from '../auth/verifyToken';
import { upsertUser } from '../services/db';
import { User } from '../models/types';

export async function bootstrapAuth(token: string): Promise<User> {
  const decodedToken = await verifyFirebaseToken(token);
  const { uid, email, name } = decodedToken;
  
  const result = await upsertUser(uid, {
    email: email || '',
    displayName: name || '',
    role: 'user',
  });

  if (!result.success || !result.data) {
    throw new Error(result.error || 'Failed to upsert user');
  }

  return result.data;
}


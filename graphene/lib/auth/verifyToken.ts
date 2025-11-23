import 'server-only';
import admin from './firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export async function verifyFirebaseToken(token: string): Promise<DecodedIdToken> {
  if (!token) {
    throw new Error('Authorization token is missing.');
  }
  
  if (!token.startsWith('eyJ')) {
    throw new Error('Invalid token format. Expected JWT token.');
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token, true);
    return decodedToken;
  } catch (error: any) {
    console.error('Error verifying token:', error.code || error.message || error);
    
    if (error.code === 'auth/id-token-expired') {
      throw new Error('Token has expired. Please sign in again.');
    } else if (error.code === 'auth/argument-error') {
      throw new Error('Invalid token format.');
    } else if (error.code === 'auth/id-token-revoked') {
      throw new Error('Token has been revoked.');
    } else if (error.code === 'auth/internal-error' || error.message?.includes('PERMISSION_DENIED') || error.message?.includes('serviceusage')) {
      const errorMessage = error.message || '';
      if (errorMessage.includes('serviceusage.serviceUsageConsumer') || errorMessage.includes('serviceusage.services.use')) {
        throw new Error('Service account missing required permissions. Please grant the service account the "Service Usage Consumer" role in Google Cloud Console: https://console.cloud.google.com/iam-admin/iam?project=graphene-3b05a');
      }
      throw new Error(`Service account permission error: ${error.message || 'Check IAM permissions in Google Cloud Console'}`);
    }
    throw new Error(`Token verification failed: ${error.message || 'Unknown error'}`);
  }
}


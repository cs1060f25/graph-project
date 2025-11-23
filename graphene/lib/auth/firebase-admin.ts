import 'server-only';
import admin from 'firebase-admin';
import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

function loadServiceAccountKey(): any {
  // Priority 1: Check environment variable for JSON string
  const envServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (envServiceAccount) {
    try {
      const serviceAccount = JSON.parse(envServiceAccount);
      if (serviceAccount.private_key && serviceAccount.client_email && serviceAccount.project_id) {
        console.log('Using FIREBASE_SERVICE_ACCOUNT_KEY environment variable for Firebase Admin credentials');
        return serviceAccount;
      }
    } catch (error) {
      console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY environment variable:', error);
    }
  }

  // Priority 2: Check for serviceAccountKey.json file
  const possiblePaths = [
    path.join(process.cwd(), 'serviceAccountKey.json'),
    path.join(process.cwd(), '..', 'serviceAccountKey.json'),
    path.join(__dirname, '..', '..', '..', 'serviceAccountKey.json'),
    path.join(__dirname, '..', '..', '..', '..', 'serviceAccountKey.json'),
  ];
  
  for (const serviceAccountPath of possiblePaths) {
    if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        console.log(`Found serviceAccountKey.json at: ${serviceAccountPath}`);
        return serviceAccount;
      } catch (error) {
        console.warn(`Failed to parse serviceAccountKey.json at ${serviceAccountPath}:`, error);
        continue;
      }
    }
  }
  
  return null;
}

if (!admin.apps.length) {
  try {
    let credential;
    const serviceAccount = loadServiceAccountKey();
    
    if (serviceAccount && serviceAccount.private_key && serviceAccount.client_email && serviceAccount.project_id) {
      const source = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON 
        ? 'FIREBASE_SERVICE_ACCOUNT_KEY environment variable' 
        : 'serviceAccountKey.json file';
      console.log(`Using ${source} for Firebase Admin credentials`);
      credential = admin.credential.cert(serviceAccount);
    } else if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
      console.log('Using environment variables for Firebase Admin credentials');
      console.warn('WARNING: Using environment variables. If you have serviceAccountKey.json, it should be used instead. Check that the file exists and is readable.');
      
      if (!config.firebase.privateKey.includes('BEGIN PRIVATE KEY') && !config.firebase.privateKey.includes('BEGIN RSA PRIVATE KEY')) {
        throw new Error('Invalid private key format. Private key must be in PEM format (should contain "BEGIN PRIVATE KEY" or "BEGIN RSA PRIVATE KEY").');
      }

      credential = admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      });
    } else {
      const missing = [];
      if (!config.firebase.projectId && !serviceAccount?.project_id) missing.push('FIREBASE_PROJECT_ID');
      if (!config.firebase.clientEmail && !serviceAccount?.client_email) missing.push('FIREBASE_CLIENT_EMAIL');
      if (!config.firebase.privateKey && !serviceAccount?.private_key) missing.push('FIREBASE_PRIVATE_KEY');
      throw new Error(`Missing Firebase configuration. Please set: ${missing.join(', ')} or provide serviceAccountKey.json`);
    }

    const projectId = serviceAccount?.project_id || config.firebase.projectId;
    
    admin.initializeApp({
      credential,
      projectId,
    });
    
    console.log(`Firebase Admin initialized successfully for project: ${projectId}`);
  } catch (error: any) {
    console.error('Firebase Admin initialization error:', error.code || error.message || error);
    if (error.code === 'app/invalid-credential' || error.message?.includes('invalid_grant') || error.message?.includes('account not found')) {
      console.error('Credential error details:', {
        hasServiceAccountFile: fs.existsSync(path.join(process.cwd(), 'serviceAccountKey.json')),
        projectId: config.firebase.projectId ? `${config.firebase.projectId.substring(0, 10)}...` : 'MISSING',
        clientEmail: config.firebase.clientEmail ? `${config.firebase.clientEmail.substring(0, 20)}...` : 'MISSING',
        privateKeyLength: config.firebase.privateKey?.length || 0,
        privateKeyStart: config.firebase.privateKey?.substring(0, 50) || 'MISSING',
      });
      throw new Error('Invalid Firebase service account credentials. The service account key may be revoked, expired, or incorrect. Please generate a new key at https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk and ensure your server time is synced.');
    }
    throw error;
  }
}

export default admin;


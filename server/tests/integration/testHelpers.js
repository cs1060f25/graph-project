// server/tests/integration/testHelpers.js
// Helper utilities for integration tests

import admin from '../../config/firebase-admin.js';

/**
 * Creates a test user and returns a custom token that can be exchanged for an ID token
 * This allows integration tests to work with real Firebase authentication
 */
export async function createTestUserToken() {
  try {
    // Create a test user with a unique email
    const testEmail = `test-${Date.now()}@integration-test.graphene.dev`;
    const testUid = `test-uid-${Date.now()}`;
    
    // Create custom token for the test user
    const customToken = await admin.auth().createCustomToken(testUid, {
      email: testEmail,
      test: true
    });
    
    return {
      customToken,
      uid: testUid,
      email: testEmail
    };
  } catch (error) {
    console.error('Error creating test user token:', error);
    throw error;
  }
}

/**
 * Gets or creates a test Firebase token for integration tests
 * Falls back to environment variable if provided
 */
export async function getTestAuthToken() {
  // First check if environment variable is set
  if (process.env.TEST_FIREBASE_TOKEN) {
    return process.env.TEST_FIREBASE_TOKEN;
  }
  
  // Try to create a test token using Firebase Admin
  try {
    const { customToken } = await createTestUserToken();
    // Note: customToken needs to be exchanged for ID token via Firebase client SDK
    // For now, we'll return null and let tests handle it
    return null;
  } catch (error) {
    console.warn('Could not create test token:', error.message);
    return null;
  }
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(uid) {
  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    // User might not exist, ignore error
    console.warn('Could not delete test user:', error.message);
  }
}


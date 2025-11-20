// Database setup utilities for integration tests
import { db } from '../../config/firebase.js';
import type { User, Folder, SavedPaper, QueryHistory } from '../../models/db.js';

/**
 * Clean up test data for a user
 */
export async function cleanupTestUser(uid: string): Promise<void> {
  try {
    // Delete all subcollections
    const [papersSnapshot, foldersSnapshot, historySnapshot] = await Promise.all([
      db.collection('users').doc(uid).collection('savedPapers').get(),
      db.collection('users').doc(uid).collection('folders').get(),
      db.collection('users').doc(uid).collection('queryHistory').get(),
    ]);

    const batch = db.batch();

    papersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    foldersSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    historySnapshot.docs.forEach((doc) => batch.delete(doc.ref));

    // Delete user document
    const userRef = db.collection('users').doc(uid);
    batch.delete(userRef);

    await batch.commit();
  } catch (error) {
    console.warn(`Failed to cleanup test user ${uid}:`, error);
  }
}

/**
 * Create a test user in the database
 */
export async function createTestUser(uid: string, email: string = 'test@example.com'): Promise<User> {
  const userData = {
    email,
    createdAt: Date.now(),
    preferences: {},
  };

  await db.collection('users').doc(uid).set(userData);

  return {
    id: uid,
    ...userData,
  };
}

/**
 * Get a unique test UID
 */
export function getTestUid(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}


// client/src/services/userService.js
// Service to sync user data with Firestore

import { db } from './firebaseClient';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Creates or updates a user document in Firestore
 * @param {Object} firebaseUser - The Firebase Auth user object
 * @param {Object} additionalData - Additional user data (e.g., name from signup form)
 * @returns {Promise<{isNewUser: boolean, error: string|null}>}
 */
export async function syncUserToFirestore(firebaseUser, additionalData = {}) {
  try {
    if (!firebaseUser || !firebaseUser.uid) {
      throw new Error('Invalid user object');
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    const userData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || additionalData.email || '',
      name: additionalData.name || firebaseUser.displayName || '',
      lastLogin: serverTimestamp(),
      preferences: additionalData.preferences || {},
    };

    // Check if this is a new user
    const isNewUser = !userDoc.exists();

    if (isNewUser) {
      // New user: create document with createdAt
      userData.createdAt = serverTimestamp();
      await setDoc(userRef, userData, { merge: false });
      console.log(`[UserService] Created new user document for ${firebaseUser.uid}`);
    } else {
      // Existing user: update lastLogin and any changed fields
      const existingData = userDoc.data();
      userData.createdAt = existingData.createdAt; // Preserve original createdAt
      
      // Only update name if it's provided and different
      if (additionalData.name && additionalData.name !== existingData.name) {
        userData.name = additionalData.name;
      }
      
      // Merge preferences (don't overwrite existing preferences)
      if (existingData.preferences && Object.keys(existingData.preferences).length > 0) {
        userData.preferences = { ...existingData.preferences, ...userData.preferences };
      }

      await setDoc(userRef, userData, { merge: true });
      console.log(`[UserService] Updated user document for ${firebaseUser.uid}`);
    }

    return { isNewUser, error: null };
  } catch (error) {
    console.error('[UserService] Error syncing user to Firestore:', error);
    return {
      isNewUser: false,
      error: error.message || 'Failed to sync user data',
    };
  }
}

/**
 * Gets user data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<{data: Object|null, error: string|null}>}
 */
export async function getUserFromFirestore(uid) {
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }

    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return { data: null, error: 'User not found' };
    }

    return { data: { id: userDoc.id, ...userDoc.data() }, error: null };
  } catch (error) {
    console.error('[UserService] Error getting user from Firestore:', error);
    return {
      data: null,
      error: error.message || 'Failed to get user data',
    };
  }
}


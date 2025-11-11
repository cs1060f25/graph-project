// user-db-interface/user.js
// User data functions for the interface layer

import { db } from "../user-db-component/firebaseConfig.js";
import { createResponse, validateUserId } from "./utils.js";

/**
 * Helper function to get user data including preferences
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Standardized response with user data
 */
export async function getUserData(uid) {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) {
      return createResponse(false, null, validation.error);
    }

    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return createResponse(false, null, "User not found");
    }

    return createResponse(true, { id: userDoc.id, ...userDoc.data() }, null);
  } catch (error) {
    console.error("Error getting user data:", error);
    return createResponse(false, null, `Failed to get user data: ${error.message}`);
  }
}

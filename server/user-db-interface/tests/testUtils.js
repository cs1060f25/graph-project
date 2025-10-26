// user-db-interface/tests/testUtils.js
// Shared utilities for testing the interface layer

import { signUpUser, loginUser } from "../../user-db-component/userService.js";
import { auth, db } from "../../user-db-component/firebaseConfig.js";
import { doc, setDoc, getDoc } from "firebase/firestore";

/**
 * Sets up authentication for testing
 * @param {string} email - Test email
 * @param {string} password - Test password
 * @returns {Promise<string>} Authenticated user ID
 */
export async function setupTestAuth(email = "test@example.com", password = "password123") {
  try {
    let uid;
    
    // Try to sign up first, if user exists, log in instead
    try {
      uid = await signUpUser(email, password);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        uid = await loginUser(email, password);
        
        // Ensure user document exists in Firestore
        const userRef = doc(db, "users", uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            email,
            createdAt: Date.now(),
            preferences: {},
          });
        }
      } else {
        throw err;
      }
    }

    console.log(`✅ Authenticated as: ${uid}`);
    return uid;
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw error;
  }
}

/**
 * Cleans up test data by logging out
 */
export function cleanupTestAuth() {
  try {
    // Note: In a real test environment, you might want to delete test data
    console.log("🧹 Test cleanup completed");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
  }
}

/**
 * Creates sample paper data for testing
 * @param {number} index - Index to make data unique
 * @returns {Object} Sample paper data
 */
export function createSamplePaperData(index = 1) {
  return {
    title: `Test Paper ${index}`,
    authors: [`Author ${index}A`, `Author ${index}B`],
    link: `https://example.com/paper${index}`,
    abstract: `This is test paper ${index} abstract...`,
    journal: `Test Journal ${index}`,
    year: 2024
  };
}

/**
 * Creates sample folder data for testing
 * @param {number} index - Index to make data unique
 * @returns {string} Sample folder name
 */
export function createSampleFolderName(index = 1) {
  return `Test Folder ${index}`;
}

/**
 * Runs a test with proper error handling
 * @param {string} testName - Name of the test
 * @param {Function} testFunction - Test function to run
 */
export async function runTest(testName, testFunction) {
  console.log(`\n🧪 Running: ${testName}`);
  try {
    await testFunction();
    console.log(`✅ ${testName} - PASSED`);
  } catch (error) {
    console.error(`❌ ${testName} - FAILED:`, error.message);
    throw error;
  }
}

/**
 * Waits for a specified amount of time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the delay
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

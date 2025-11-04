// user-db-interface/tests/testUser.js
// Tests for user data functions

import { getUserData } from "../../../server/user-db-interface/user.js";
import { setupTestAuth, cleanupTestAuth, runTest } from "./testUtils.js";

/**
 * Test getting user data
 */
async function testGetUserData() {
  const uid = await setupTestAuth();
  
  const result = await getUserData(uid);
  
  if (!result.success) {
    throw new Error(`Failed to get user data: ${result.error}`);
  }
  
  // Verify user data structure
  const userData = result.data;
  if (!userData.id || !userData.email) {
    throw new Error("User data missing required fields (id, email)");
  }
  
  console.log("👤 User data retrieved:", {
    id: userData.id,
    email: userData.email,
    hasPreferences: !!userData.preferences,
    hasCreatedAt: !!userData.createdAt
  });
}

/**
 * Test getting user data with invalid UID
 */
async function testGetUserDataInvalidUID() {
  const result = await getUserData("");
  
  if (result.success) {
    throw new Error("Should have failed with empty UID");
  }
  
  console.log("👤 Invalid UID validation working correctly");
}

/**
 * Test getting user data with non-existent UID
 */
async function testGetUserDataNonExistentUID() {
  const result = await getUserData("non-existent-uid-12345");
  
  if (result.success) {
    throw new Error("Should have failed with non-existent UID");
  }
  
  // Due to Firestore security rules, we might get permission denied instead of "User not found"
  if (!result.error.includes("User not found") && !result.error.includes("permission-denied") && !result.error.includes("Missing or insufficient permissions")) {
    throw new Error(`Expected "User not found" or permission error, got: ${result.error}`);
  }
  
  console.log("👤 Non-existent UID handling working correctly");
}

/**
 * Test getting user data with null UID
 */
async function testGetUserDataNullUID() {
  const result = await getUserData(null);
  
  if (result.success) {
    throw new Error("Should have failed with null UID");
  }
  
  console.log("👤 Null UID validation working correctly");
}

/**
 * Test getting user data with undefined UID
 */
async function testGetUserDataUndefinedUID() {
  const result = await getUserData(undefined);
  
  if (result.success) {
    throw new Error("Should have failed with undefined UID");
  }
  
  console.log("👤 Undefined UID validation working correctly");
}

/**
 * Run all user data tests
 */
export async function runUserTests() {
  console.log("🚀 Starting User Data Tests...");
  
  try {
    await runTest("Get User Data", testGetUserData);
    await runTest("Get User Data - Invalid UID", testGetUserDataInvalidUID);
    await runTest("Get User Data - Non-existent UID", testGetUserDataNonExistentUID);
    await runTest("Get User Data - Null UID", testGetUserDataNullUID);
    await runTest("Get User Data - Undefined UID", testGetUserDataUndefinedUID);
    
    console.log("\n✅ All user data tests completed successfully!");
  } catch (error) {
    console.error("\n❌ User data tests failed:", error.message);
    throw error;
  } finally {
    cleanupTestAuth();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runUserTests();
}

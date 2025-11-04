// user-db-interface/tests/testFolders.js
// Tests for folder-related functions

import { getUserFolders, addUserFolder } from "../../../server/user-db-interface/folders.js";
import { setupTestAuth, cleanupTestAuth, runTest, createSampleFolderName } from "./testUtils.js";

/**
 * Test getting user folders
 */
async function testGetUserFolders() {
  const uid = await setupTestAuth();
  
  const result = await getUserFolders(uid);
  
  if (!result.success) {
    throw new Error(`Failed to get folders: ${result.error}`);
  }
  
  console.log("📁 Folders retrieved:", result.data.length, "items");
}

/**
 * Test adding a user folder
 */
async function testAddUserFolder() {
  const uid = await setupTestAuth();
  const folderName = createSampleFolderName(1);
  
  const result = await addUserFolder(uid, folderName);
  
  if (!result.success) {
    throw new Error(`Failed to add folder: ${result.error}`);
  }
  
  console.log("📁 Folder added:", result.data.name);
}

/**
 * Test adding folder with invalid data
 */
async function testAddUserFolderInvalidData() {
  const uid = await setupTestAuth();
  
  // Test with empty folder name
  const result1 = await addUserFolder(uid, "");
  if (result1.success) {
    throw new Error("Should have failed with empty folder name");
  }
  
  // Test with null folder name
  const result2 = await addUserFolder(uid, null);
  if (result2.success) {
    throw new Error("Should have failed with null folder name");
  }
  
  console.log("📁 Invalid data validation working correctly");
}

/**
 * Test getting folders with invalid UID
 */
async function testGetUserFoldersInvalidUID() {
  const result = await getUserFolders("");
  
  if (result.success) {
    throw new Error("Should have failed with empty UID");
  }
  
  console.log("📁 Invalid UID validation working correctly");
}

/**
 * Run all folder tests
 */
export async function runFolderTests() {
  console.log("🚀 Starting Folder Tests...");
  
  try {
    await runTest("Get User Folders", testGetUserFolders);
    await runTest("Add User Folder", testAddUserFolder);
    await runTest("Add Folder - Invalid Data", testAddUserFolderInvalidData);
    await runTest("Get Folders - Invalid UID", testGetUserFoldersInvalidUID);
    
    console.log("\n✅ All folder tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Folder tests failed:", error.message);
    throw error;
  } finally {
    cleanupTestAuth();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFolderTests();
}

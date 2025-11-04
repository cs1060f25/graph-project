// user-db-interface/tests/testSubscriptions.js
// Tests for real-time subscription functions

import { subscribeToFolders, subscribeToSavedPapers } from "../../../server/user-db-interface/subscriptions.js";
import { addUserFolder } from "../../../server/user-db-interface/folders.js";
import { addSavedPaper } from "../../../server/user-db-interface/papers.js";
import { setupTestAuth, cleanupTestAuth, runTest, createSampleFolderName, createSamplePaperData, wait } from "./testUtils.js";

/**
 * Test folder subscription
 */
async function testFolderSubscription() {
  const uid = await setupTestAuth();
  
  return new Promise((resolve, reject) => {
    let updateCount = 0;
    let subscriptionData = null;
    
    const unsubscribe = subscribeToFolders(uid, (response) => {
      updateCount++;
      subscriptionData = response;
      
      if (updateCount === 1) {
        // First update should contain existing folders
        if (!response.success) {
          reject(new Error(`Folder subscription failed: ${response.error}`));
          return;
        }
        console.log("📁 Folder subscription - initial data received");
      }
    });
    
    // Wait a bit for initial data
    setTimeout(async () => {
      try {
        // Add a new folder to trigger subscription update
        const folderName = createSampleFolderName(Date.now());
        await addUserFolder(uid, folderName);
        
        // Wait for subscription to update
        await wait(1000);
        
        if (updateCount >= 1) {
          console.log("📁 Folder subscription working correctly");
          unsubscribe();
          resolve();
        } else {
          reject(new Error("Folder subscription did not receive updates"));
        }
      } catch (error) {
        unsubscribe();
        reject(error);
      }
    }, 500);
  });
}

/**
 * Test saved papers subscription
 */
async function testSavedPapersSubscription() {
  const uid = await setupTestAuth();
  
  return new Promise((resolve, reject) => {
    let updateCount = 0;
    let subscriptionData = null;
    
    const unsubscribe = subscribeToSavedPapers(uid, (response) => {
      updateCount++;
      subscriptionData = response;
      
      if (updateCount === 1) {
        // First update should contain existing papers
        if (!response.success) {
          reject(new Error(`Saved papers subscription failed: ${response.error}`));
          return;
        }
        console.log("📄 Saved papers subscription - initial data received");
      }
    });
    
    // Wait a bit for initial data
    setTimeout(async () => {
      try {
        // Add a new paper to trigger subscription update
        const paperData = createSamplePaperData(Date.now());
        await addSavedPaper(uid, paperData);
        
        // Wait for subscription to update
        await wait(1000);
        
        if (updateCount >= 1) {
          console.log("📄 Saved papers subscription working correctly");
          unsubscribe();
          resolve();
        } else {
          reject(new Error("Saved papers subscription did not receive updates"));
        }
      } catch (error) {
        unsubscribe();
        reject(error);
      }
    }, 500);
  });
}

/**
 * Test subscription with invalid UID
 */
async function testSubscriptionInvalidUID() {
  const unsubscribe = subscribeToFolders("", (response) => {
    // This should not be called
    throw new Error("Callback should not be called with invalid UID");
  });
  
  // Should return a no-op function
  if (typeof unsubscribe !== 'function') {
    throw new Error("Should return unsubscribe function even with invalid UID");
  }
  
  unsubscribe();
  console.log("📡 Invalid UID subscription handling working correctly");
}

/**
 * Test subscription with invalid callback
 */
async function testSubscriptionInvalidCallback() {
  const uid = await setupTestAuth();
  
  const unsubscribe = subscribeToFolders(uid, "not a function");
  
  // Should return a no-op function
  if (typeof unsubscribe !== 'function') {
    throw new Error("Should return unsubscribe function even with invalid callback");
  }
  
  unsubscribe();
  console.log("📡 Invalid callback subscription handling working correctly");
}

/**
 * Test subscription cleanup
 */
async function testSubscriptionCleanup() {
  const uid = await setupTestAuth();
  
  let callbackCalled = false;
  
  const unsubscribe = subscribeToFolders(uid, (response) => {
    callbackCalled = true;
  });
  
  // Unsubscribe immediately
  unsubscribe();
  
  // Wait a bit and add a folder
  await wait(500);
  await addUserFolder(uid, createSampleFolderName(Date.now()));
  
  // Wait a bit more
  await wait(1000);
  
  if (callbackCalled) {
    throw new Error("Callback was called after unsubscribe");
  }
  
  console.log("📡 Subscription cleanup working correctly");
}

/**
 * Run all subscription tests
 */
export async function runSubscriptionTests() {
  console.log("🚀 Starting Subscription Tests...");
  
  try {
    await runTest("Folder Subscription", testFolderSubscription);
    await runTest("Saved Papers Subscription", testSavedPapersSubscription);
    await runTest("Subscription - Invalid UID", testSubscriptionInvalidUID);
    await runTest("Subscription - Invalid Callback", testSubscriptionInvalidCallback);
    await runTest("Subscription Cleanup", testSubscriptionCleanup);
    
    console.log("\n✅ All subscription tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Subscription tests failed:", error.message);
    throw error;
  } finally {
    cleanupTestAuth();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSubscriptionTests();
}

// user-db-interface/tests/testPapers.js
// Tests for saved papers functions

import { addSavedPaper, getSavedPapers } from "../papers.js";
import { setupTestAuth, cleanupTestAuth, runTest, createSamplePaperData } from "./testUtils.js";

/**
 * Test adding a saved paper
 */
async function testAddSavedPaper() {
  const uid = await setupTestAuth();
  const paperData = createSamplePaperData(1);
  
  const result = await addSavedPaper(uid, paperData);
  
  if (!result.success) {
    throw new Error(`Failed to add paper: ${result.error}`);
  }
  
  console.log("📄 Paper added:", result.data.title);
}

/**
 * Test getting saved papers
 */
async function testGetSavedPapers() {
  const uid = await setupTestAuth();
  
  const result = await getSavedPapers(uid);
  
  if (!result.success) {
    throw new Error(`Failed to get papers: ${result.error}`);
  }
  
  console.log("📄 Papers retrieved:", result.data.length, "items");
}

/**
 * Test adding paper with invalid data
 */
async function testAddSavedPaperInvalidData() {
  const uid = await setupTestAuth();
  
  // Test with missing required fields
  const invalidPaper1 = { title: "Test Paper" }; // Missing authors and link
  const result1 = await addSavedPaper(uid, invalidPaper1);
  if (result1.success) {
    throw new Error("Should have failed with missing required fields");
  }
  
  // Test with null paper data
  const result2 = await addSavedPaper(uid, null);
  if (result2.success) {
    throw new Error("Should have failed with null paper data");
  }
  
  // Test with non-object data
  const result3 = await addSavedPaper(uid, "not an object");
  if (result3.success) {
    throw new Error("Should have failed with non-object data");
  }
  
  console.log("📄 Invalid data validation working correctly");
}

/**
 * Test getting papers with invalid UID
 */
async function testGetSavedPapersInvalidUID() {
  const result = await getSavedPapers("");
  
  if (result.success) {
    throw new Error("Should have failed with empty UID");
  }
  
  console.log("📄 Invalid UID validation working correctly");
}

/**
 * Test adding multiple papers and sorting
 */
async function testMultiplePapersAndSorting() {
  const uid = await setupTestAuth();
  
  // Add multiple papers with slight delays to ensure different timestamps
  const paper1 = createSamplePaperData(1);
  await addSavedPaper(uid, paper1);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const paper2 = createSamplePaperData(2);
  await addSavedPaper(uid, paper2);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const paper3 = createSamplePaperData(3);
  await addSavedPaper(uid, paper3);
  
  // Get papers and verify they're sorted by creation date (newest first)
  const result = await getSavedPapers(uid);
  
  if (!result.success) {
    throw new Error(`Failed to get papers: ${result.error}`);
  }
  
  const papers = result.data;
  if (papers.length < 3) {
    throw new Error(`Expected at least 3 papers, got ${papers.length}`);
  }
  
  // Check if papers are sorted by creation date (newest first)
  for (let i = 0; i < papers.length - 1; i++) {
    if (papers[i].createdAt < papers[i + 1].createdAt) {
      throw new Error("Papers are not sorted by creation date (newest first)");
    }
  }
  
  console.log("📄 Multiple papers and sorting working correctly");
}

/**
 * Run all papers tests
 */
export async function runPapersTests() {
  console.log("🚀 Starting Papers Tests...");
  
  try {
    await runTest("Add Saved Paper", testAddSavedPaper);
    await runTest("Get Saved Papers", testGetSavedPapers);
    await runTest("Add Paper - Invalid Data", testAddSavedPaperInvalidData);
    await runTest("Get Papers - Invalid UID", testGetSavedPapersInvalidUID);
    await runTest("Multiple Papers and Sorting", testMultiplePapersAndSorting);
    
    console.log("\n✅ All papers tests completed successfully!");
  } catch (error) {
    console.error("\n❌ Papers tests failed:", error.message);
    throw error;
  } finally {
    cleanupTestAuth();
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPapersTests();
}

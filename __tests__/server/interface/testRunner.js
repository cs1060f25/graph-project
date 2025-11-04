// user-db-interface/tests/testRunner.js
// Main test runner that executes all test suites

import { runFolderTests } from "./testFolders.js";
import { runPapersTests } from "./testPapers.js";
import { runSubscriptionTests } from "./testSubscriptions.js";
import { runUserTests } from "./testUser.js";

/**
 * Run all test suites
 */
async function runAllTests() {
  console.log("🧪 Starting GRAPHENE User Interface Layer Tests");
  console.log("=" .repeat(60));
  
  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  
  const testSuites = [
    { name: "Folder Tests", runner: runFolderTests },
    { name: "Papers Tests", runner: runPapersTests },
    { name: "Subscription Tests", runner: runSubscriptionTests },
    { name: "User Data Tests", runner: runUserTests }
  ];
  
  for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name}...`);
    console.log("-".repeat(40));
    
    try {
      await suite.runner();
      passedTests++;
      console.log(`✅ ${suite.name} - PASSED`);
    } catch (error) {
      failedTests++;
      console.error(`❌ ${suite.name} - FAILED:`, error.message);
    }
    
    totalTests++;
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Results Summary:");
  console.log(`   Total Suites: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Duration: ${duration}ms`);
  
  if (failedTests === 0) {
    console.log("\n🎉 All tests passed successfully!");
    process.exit(0);
  } else {
    console.log(`\n💥 ${failedTests} test suite(s) failed!`);
    process.exit(1);
  }
}

/**
 * Run specific test suite
 * @param {string} suiteName - Name of the test suite to run
 */
async function runSpecificTest(suiteName) {
  const testSuites = {
    "folders": runFolderTests,
    "papers": runPapersTests,
    "subscriptions": runSubscriptionTests,
    "user": runUserTests
  };
  
  const runner = testSuites[suiteName.toLowerCase()];
  
  if (!runner) {
    console.error(`❌ Unknown test suite: ${suiteName}`);
    console.log("Available test suites: folders, papers, subscriptions, user");
    process.exit(1);
  }
  
  console.log(`🧪 Running ${suiteName} test suite...`);
  console.log("=" .repeat(60));
  
  try {
    await runner();
    console.log("\n🎉 Test suite completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n💥 Test suite failed:", error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const suiteName = args[0];

if (suiteName) {
  runSpecificTest(suiteName);
} else {
  runAllTests();
}

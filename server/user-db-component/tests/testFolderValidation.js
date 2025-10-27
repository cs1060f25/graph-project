// server/user-db-component/tests/testFolderNameValidation.js
// Test to verify missing folder name validation in user-db-component

import dotenv from "dotenv";
dotenv.config();

import { addFolder, getFolders } from "../userDataService.js";
import { signUpUser, loginUser } from "../userService.js";
import { db, auth } from "../firebaseConfig.js";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { deleteApp, getApp } from "firebase/app";

async function testFolderNameValidation() {
  console.log("🔍 Testing Folder Name Validation...\n");

  const validationResults = [];

  try {
    // Create a valid user for testing
    console.log("1️⃣ Creating test user...");
    const testEmail = "foldertest@example.com";
    const testPassword = "password123";
    
    await signUpUser(testEmail, testPassword).catch(async (err) => {
      if (err.code === "auth/email-already-in-use") {
        await loginUser(testEmail, testPassword);
      } else {
        throw err;
      }
    });

    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("User not authenticated after login/signup.");
    console.log("✅ Test user created:", uid);

    // Test cases for folder name validation
    const testCases = [
      {
        description: "Empty string",
        input: "",
        shouldFail: true
      },
      {
        description: "Null value",
        input: null,
        shouldFail: true
      },
      {
        description: "Undefined value",
        input: undefined,
        shouldFail: true
      },
      {
        description: "Only spaces",
        input: "   ",
        shouldFail: true
      },
      {
        description: "Only tabs",
        input: "\t\t\t",
        shouldFail: true
      },
      {
        description: "Only newlines",
        input: "\n\n\n",
        shouldFail: true
      },
      {
        description: "Mixed whitespace",
        input: " \t\n ",
        shouldFail: true
      },
      {
        description: "Valid folder name",
        input: "My Documents",
        shouldFail: false
      },
      {
        description: "Folder name with special characters",
        input: "Folder!@#$%^&*()",
        shouldFail: false // Currently accepted, but might want to validate
      },
      {
        description: "Folder name with unicode",
        input: "Földér Nämé",
        shouldFail: false // Currently accepted, but might want to validate
      },
      {
        description: "Very short name",
        input: "A",
        shouldFail: false
      },
      {
        description: "Long but reasonable name",
        input: "This is a very long folder name that should still be valid",
        shouldFail: false
      }
    ];

    console.log("\n2️⃣ Testing folder name validation...");
    console.log("=" .repeat(50));

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.description}`);
      console.log(`   Input: ${JSON.stringify(testCase.input)}`);

      try {
        const result = await addFolder(uid, testCase.input);
        
        if (testCase.shouldFail) {
          console.log(`   ❌ UNEXPECTED SUCCESS: ${result}`);
          validationResults.push({
            test: testCase.description,
            input: testCase.input,
            result: "UNEXPECTED SUCCESS",
            expected: "Should have failed with validation error",
            issue: "Missing validation"
          });
        } else {
          console.log(`   ✅ Expected success: ${result}`);
          validationResults.push({
            test: testCase.description,
            input: testCase.input,
            result: "SUCCESS",
            expected: "Should succeed",
            issue: "None"
          });
        }
      } catch (error) {
        if (testCase.shouldFail) {
          console.log(`   ✅ Expected error: ${error.message}`);
          validationResults.push({
            test: testCase.description,
            input: testCase.input,
            result: error.message,
            expected: "Should have failed with validation error",
            issue: "None"
          });
        } else {
          console.log(`   ❌ UNEXPECTED ERROR: ${error.message}`);
          validationResults.push({
            test: testCase.description,
            input: testCase.input,
            result: error.message,
            expected: "Should succeed",
            issue: "Function error"
          });
        }
      }
    }

    // Test 3: Check what actually gets stored
    console.log("\n3️⃣ Checking what data gets stored...");
    console.log("=" .repeat(50));

    const foldersRef = collection(db, "users", uid, "folders");
    const snapshot = await getDocs(foldersRef);
    const folders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`📁 Total folders created: ${folders.length}`);
    console.log("📄 Folder data:");
    folders.forEach((folder, index) => {
      console.log(`   ${index + 1}. Name: "${folder.name}" (length: ${folder.name?.length || 'undefined'})`);
    });

    // Test 4: Check for problematic data
    console.log("\n4️⃣ Analyzing stored data for issues...");
    console.log("=" .repeat(50));

    const problematicFolders = folders.filter(folder => {
      const name = folder.name;
      return !name || 
             name.trim().length === 0 || 
             name.length > 100 || 
             /[\n\t]/.test(name);
    });

    if (problematicFolders.length > 0) {
      console.log(`❌ Found ${problematicFolders.length} problematic folder(s):`);
      problematicFolders.forEach((folder, index) => {
        console.log(`   ${index + 1}. "${folder.name}" - Issues: ${getFolderIssues(folder.name)}`);
      });
    } else {
      console.log("✅ No problematic folders found");
    }

    // Summary
    console.log("\n" + "=" .repeat(60));
    console.log("📊 FOLDER NAME VALIDATION SUMMARY");
    console.log("=" .repeat(60));

    const unexpectedSuccesses = validationResults.filter(r => r.result === "UNEXPECTED SUCCESS");
    const unexpectedErrors = validationResults.filter(r => r.issue === "Function error");
    const missingValidation = validationResults.filter(r => r.issue === "Missing validation");

    console.log(`\n📈 Test Results:`);
    console.log(`   Total tests: ${validationResults.length}`);
    console.log(`   Unexpected successes: ${unexpectedSuccesses.length}`);
    console.log(`   Unexpected errors: ${unexpectedErrors.length}`);
    console.log(`   Missing validation: ${missingValidation.length}`);

    if (missingValidation.length > 0) {
      console.log(`\n🚨 VALIDATION ISSUES DETECTED:`);
      missingValidation.forEach(issue => {
        console.log(`   ❌ ${issue.test}: "${issue.input}"`);
      });
      console.log(`\n💡 RECOMMENDED FIX:`);
      console.log(`   Add input validation to addFolder function:`);
      console.log(`   - Check for empty/null/undefined values`);
      console.log(`   - Trim whitespace and validate length`);
      console.log(`   - Consider character restrictions`);
    } else {
      console.log(`\n✅ NO VALIDATION ISSUES DETECTED`);
    }

    if (unexpectedErrors.length > 0) {
      console.log(`\n⚠️  FUNCTION ERRORS:`);
      unexpectedErrors.forEach(error => {
        console.log(`   ❌ ${error.test}: ${error.result}`);
      });
    }

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

function getFolderIssues(name) {
  const issues = [];
  
  if (!name) {
    issues.push("null/undefined name");
  } else {
    if (name.trim().length === 0) {
      issues.push("empty after trim");
    }
    if (name.length > 100) {
      issues.push("too long");
    }
    if (/[\n\t]/.test(name)) {
      issues.push("contains newlines/tabs");
    }
  }
  
  return issues.length > 0 ? issues.join(", ") : "none";
}

// Run the test
testFolderNameValidation()
  .then(async () => {
    console.log("\n✨ Folder name validation test complete");
    try {
      const app = getApp();
      await deleteApp(app);
    } catch (_) {}
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Folder name validation test failed:", err.message);
    try {
      const app = getApp();
      await deleteApp(app);
    } catch (_) {}
    process.exit(1);
  });

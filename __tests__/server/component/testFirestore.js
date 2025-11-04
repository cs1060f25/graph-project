// server/user-db/tests/testFirestore.js

import dotenv from "dotenv";
dotenv.config();

import { addFolder, getFolders } from "../../../server/user-db-component/userDataService.js";
import { signUpUser } from "../../../server/user-db-component/userService.js";

async function runFirestoreTests() {
  console.log("Running Firestore Tests...");

  try {
    // Create a test user first
    const uid = await signUpUser("firestoretest@example.com", "password123");
    console.log("✅ Created test user:", uid);

    // Add a test folder
    await addFolder(uid, "My First Folder");
    console.log("✅ Folder added");

    // Retrieve folders
    const folders = await getFolders(uid);
    console.log("✅ Retrieved folders:", folders);
  } catch (err) {
    console.error("❌ Firestore test failed:", err.message);
  }
}

runFirestoreTests();

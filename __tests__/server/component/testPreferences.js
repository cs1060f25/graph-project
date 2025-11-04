// server/user-db/tests/testPreferences.js
import dotenv from "dotenv";
dotenv.config();

import { signUpUser, loginUser } from "../../../server/user-db-component/userService.js";
import { db, auth } from "../../../server/user-db-component/firebaseConfig.js";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { deleteApp, getApp } from "firebase/app";

async function runPreferencesTests() {
  console.log("Running Preferences Tests...");

  const testEmail = "preferences@example.com";
  const testPassword = "password123";

  // Sign up or log in the test user
  await signUpUser(testEmail, testPassword).catch(async (err) => {
    if (err.code === "auth/email-already-in-use") {
      console.log("ℹ️  User already exists — logging in...");
      await loginUser(testEmail, testPassword);
    } else {
      throw err;
    }
  });

  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not authenticated after login/signup.");

  const userRef = doc(db, "users", uid);

  // Define new preferences to update
  const newPrefs = { theme: "dark", layout: "grid" };

  // Ensure document exists, then merge new preferences
  await setDoc(userRef, { preferences: newPrefs }, { merge: true });
  console.log("✅ Updated preferences:", newPrefs);

  // Fetch and verify updated preferences
  const snapshot = await getDoc(userRef);
  const prefs = snapshot.data()?.preferences || {};
  console.log("✅ Retrieved preferences:", prefs);

  if (prefs.theme === newPrefs.theme && prefs.layout === newPrefs.layout) {
    console.log("✅ Preferences test passed successfully!");
  } else {
    throw new Error("Preferences do not match expected values.");
  }
}

// Run and cleanly shut down Firebase
runPreferencesTests()
  .then(async () => {
    console.log("✨ Preferences test complete");
    const app = getApp();
    await deleteApp(app);
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Preferences Test Failed:", err.message);
    try {
      const app = getApp();
      await deleteApp(app);
    } catch (_) {}
    process.exit(1);
  });

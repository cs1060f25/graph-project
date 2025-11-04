// server/user-db/tests/testAuth.js
import dotenv from "dotenv";
dotenv.config();

import { signUpUser, loginUser, logoutUser } from "../../../server/user-db-component/userService.js";

async function runAuthTests() {
  console.log("Running Auth Tests...");

  const testEmail = "testuser@example.com";
  const testPassword = "password123";

  try {
    // Try creating the user
    const uid = await signUpUser(testEmail, testPassword);
    console.log("✅ Signup successful:", uid);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("ℹ️  User already exists — logging in instead...");
      await loginUser(testEmail, testPassword);
    } else {
      throw err;
    }
  }

  try {
    await logoutUser();
    console.log("✅ Logout successful");
  } catch (err) {
    console.error("❌ Logout failed:", err.message);
  }
}

runAuthTests();

// server/user-db/tests/testUnauthorizedAccess.js
import dotenv from "dotenv";
dotenv.config();

import { signUpUser, loginUser } from "../../../server/user-db-component/userService.js";
import { db } from "../../../server/user-db-component/firebaseConfig.js";
import { collection, getDocs } from "firebase/firestore";
import { addFolder } from "../../../server/user-db-component/userDataService.js";

async function runUnauthorizedAccessTest() {
  console.log("Running Unauthorized Access Test...");

  const password = "password123";
  const user1Email = "user1@example.com";
  const user2Email = "user2@example.com";

  // Sign up or log in as User 1
  await signUpUser(user1Email, password).catch(async (err) => {
    if (err.code === "auth/email-already-in-use") {
      await loginUser(user1Email, password);
    } else throw err;
  });
  const uid1 = (await import("../../../server/user-db-component/firebaseConfig.js")).auth.currentUser.uid;

  // Try adding a folder for user 1
  try {
    await addFolder(uid1, "Private Folder");
    console.log("✅ User1 created folder.");
  } catch (err) {
    console.error("⚠️ User1 write failed (rules may be strict):", err.message);
  }

  // Log in as User 2
  await signUpUser(user2Email, password).catch(async (err) => {
    if (err.code === "auth/email-already-in-use") {
      await loginUser(user2Email, password);
    } else throw err;
  });
  const uid2 = (await import("../../../server/user-db-component/firebaseConfig.js")).auth.currentUser.uid;
  console.log("✅ Logged in as User2:", uid2);

  // Try to access User1's data
  const forbiddenRef = collection(db, "users", uid1, "folders");
  try {
    await getDocs(forbiddenRef);
    console.error("❌ SECURITY FAILURE: User2 accessed User1's data!");
  } catch (err) {
    if (err.code === "permission-denied") {
      console.log("✅ Security check passed: User2 cannot access User1's data.");
    } else {
      console.error("❌ Unexpected error:", err.message);
    }
  }
}

runUnauthorizedAccessTest().catch((err) =>
  console.error("❌ Unauthorized Access Test Failed:", err.message)
);

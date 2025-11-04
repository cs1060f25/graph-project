// server/user-db/tests/testSavedPapers.js
import dotenv from "dotenv";
dotenv.config();

import { signUpUser, loginUser } from "../../../server/user-db-component/userService.js";
import { db } from "../../../server/user-db-component/firebaseConfig.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

async function runSavedPapersTests() {
  console.log("Running Saved Papers Tests...");

  const testEmail = "savedpapers@example.com";
  const testPassword = "password123";

  await signUpUser(testEmail, testPassword).catch(async (err) => {
    if (err.code === "auth/email-already-in-use") {
      await loginUser(testEmail, testPassword);
    } else throw err;
  });

  const uid = (await import("../firebaseConfig.js")).auth.currentUser.uid;
  console.log("✅ Authenticated as:", uid);

  // Add a saved paper
  const papersRef = collection(db, "users", uid, "savedPapers");
  const newPaper = { title: "Graph Neural Networks", year: 2021 };
  const docRef = await addDoc(papersRef, newPaper);
  console.log("✅ Added saved paper with ID:", docRef.id);

  // Retrieve saved papers
  const snapshot = await getDocs(papersRef);
  console.log(
    "✅ Retrieved saved papers:",
    snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
  );

  // Delete one paper
  await deleteDoc(doc(db, "users", uid, "savedPapers", docRef.id));
  console.log("✅ Deleted saved paper:", docRef.id);
}

runSavedPapersTests().catch((err) => console.error("❌ Saved Papers Test Failed:", err.message));

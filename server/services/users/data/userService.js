// server/services/users/data/userService.js
// Note: This file appears to use client-side Firebase SDK which is incorrect for server-side
// Server should use Firebase Admin SDK. This may be deprecated/unused.
import { auth, db } from "../config/firebaseConfig.js";

// Sign up a new user
export async function signUpUser(email, password) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;
  await setDoc(doc(db, "users", uid), {
    email,
    createdAt: Date.now(),
    preferences: {},
  });
  return uid;
}

// Log in existing user
export async function loginUser(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user.uid;
}

// Log out
export async function logoutUser() {
  await signOut(auth);
}

// Track auth state
export function onUserStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

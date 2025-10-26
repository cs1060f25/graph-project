// user-db/userService.js
import { auth, db } from "./firebaseConfig.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

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

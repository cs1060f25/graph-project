// user-db/userDataService.js
import { db } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";

export async function addFolder(uid, folderName) {
  // Input validation for UID
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('User ID is required and must be a non-empty string');
  }

  // Input validation for folder name
  if (!folderName || typeof folderName !== 'string') {
    throw new Error('Folder name is required and must be a string');
  }
  
  const trimmedName = folderName.trim();
  if (trimmedName.length === 0) {
    throw new Error('Folder name cannot be empty or only whitespace');
  }
  
  if (trimmedName.length > 100) {
    throw new Error('Folder name cannot exceed 100 characters');
  }

  // Check for problematic characters (optional - can be removed if unicode is desired)
  if (/[\n\t\r]/.test(trimmedName)) {
    throw new Error('Folder name cannot contain newlines, tabs, or carriage returns');
  }

  const folderRef = collection(db, "users", uid, "folders");
  await addDoc(folderRef, { name: trimmedName, createdAt: Date.now() });
}

export async function getFolders(uid) {
  // Input validation for UID
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('User ID is required and must be a non-empty string');
  }

  const folderRef = collection(db, "users", uid, "folders");
  const snapshot = await getDocs(folderRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updatePreferences(uid, prefs) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { preferences: prefs });
}

// server/services/users/data/userDataService.js
import { db } from "../config/firebaseConfig.js";

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

  const folderRef = db.collection("users").doc(uid).collection("folders");
  const docRef = await folderRef.add({ name: trimmedName, createdAt: Date.now() });
  
  // Return the created folder with its ID
  return {
    id: docRef.id,
    name: trimmedName,
    createdAt: Date.now()
  };
}

export async function getFolders(uid) {
  // Input validation for UID
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('User ID is required and must be a non-empty string');
  }

  const folderRef = db.collection("users").doc(uid).collection("folders");
  const snapshot = await folderRef.get();
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function deleteFolder(uid, folderId) {
  // Input validation for UID
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('User ID is required and must be a non-empty string');
  }
  
  // Input validation for folder ID
  if (!folderId || typeof folderId !== 'string' || folderId.trim().length === 0) {
    throw new Error('Folder ID is required and must be a non-empty string');
  }
  
  const folderRef = db.collection("users").doc(uid).collection("folders").doc(folderId);
  
  // Check if folder exists before deleting
  const doc = await folderRef.get();
  if (!doc.exists) {
    throw new Error('Folder not found');
  }
  
  // Delete the folder
  await folderRef.delete();
  
  // Return the deleted folder ID for confirmation
  return {
    id: folderId,
    deletedAt: Date.now()
  };
}


export async function updatePreferences(uid, prefs) {
  const userRef = db.collection("users").doc(uid);
  await userRef.update({ preferences: prefs });
}

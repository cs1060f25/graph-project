// user-db/userDataService.js
import { db } from "./firebaseConfig.js";
import { collection, addDoc, getDocs, doc, updateDoc } from "firebase/firestore";

export async function addFolder(uid, folderName) {
  const folderRef = collection(db, "users", uid, "folders");
  await addDoc(folderRef, { name: folderName, createdAt: Date.now() });
}

export async function getFolders(uid) {
  const folderRef = collection(db, "users", uid, "folders");
  const snapshot = await getDocs(folderRef);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updatePreferences(uid, prefs) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { preferences: prefs });
}

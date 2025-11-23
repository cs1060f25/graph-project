import { db } from '../auth/firestore';
import { createResponse, validateUserId, validatePaperData, validatePaperUpdate, validateFolderName } from '../models/validation';
import { ApiResponse, Paper, PaperInput, Folder, QueryHistory, QueryHistoryInput, User, UserInput } from '../models/types';

export async function getSavedPapers(uid: string): Promise<ApiResponse<Paper[]>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse(false, null, validation.error);

    const snapshot = await db.collection("users").doc(uid).collection("savedPapers").get();
    const papers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Paper));
    papers.sort((a, b) => ((b.createdAt as number) || 0) - ((a.createdAt as number) || 0));
    return createResponse(true, papers, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to get saved papers: ${error.message}`);
  }
}

export async function addSavedPaper(uid: string, paperData: PaperInput): Promise<ApiResponse<Paper>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse(false, null, uidValidation.error);

    const dataValidation = validatePaperData(paperData);
    if (!dataValidation.isValid) return createResponse(false, null, dataValidation.error);

    const docRef = await db.collection("users").doc(uid).collection("savedPapers").add({
      ...paperData,
      starred: paperData.starred ?? false,
      folderId: paperData.folderId ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return createResponse(true, { id: docRef.id, ...paperData, starred: paperData.starred ?? false, folderId: paperData.folderId ?? null } as Paper, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to add paper: ${error.message}`);
  }
}

export async function updateSavedPaper(uid: string, paperId: string, updateData: Partial<Paper>): Promise<ApiResponse<Paper>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse(false, null, uidValidation.error);

    if (!paperId || typeof paperId !== 'string') {
      return createResponse(false, null, "Paper ID is required and must be a string");
    }

    const updateValidation = validatePaperUpdate(updateData);
    if (!updateValidation.isValid) return createResponse(false, null, updateValidation.error);

    const paperRef = db.collection("users").doc(uid).collection("savedPapers").doc(paperId);
    const paperDoc = await paperRef.get();

    if (!paperDoc.exists) return createResponse(false, null, "Paper not found");

    await paperRef.update({ ...updateData, updatedAt: Date.now() });
    const updatedDoc = await paperRef.get();
    return createResponse(true, { id: updatedDoc.id, ...updatedDoc.data() } as Paper, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to update paper: ${error.message}`);
  }
}

export async function deleteSavedPaper(uid: string, paperId: string): Promise<ApiResponse<void>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse(false, null, uidValidation.error);

    if (!paperId || typeof paperId !== 'string') {
      return createResponse(false, null, "Paper ID is required and must be a string");
    }

    const paperRef = db.collection("users").doc(uid).collection("savedPapers").doc(paperId);
    const paperDoc = await paperRef.get();

    if (!paperDoc.exists) return createResponse(false, null, "Paper not found");

    await paperRef.delete();
    return createResponse(true, undefined, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to delete paper: ${error.message}`);
  }
}

export async function getUserFolders(uid: string): Promise<ApiResponse<Folder[]>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse(false, null, validation.error);

    const snapshot = await db.collection("users").doc(uid).collection("folders").get();
    const folders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Folder));
    return createResponse(true, folders, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to get folders: ${error.message}`);
  }
}

export async function addUserFolder(uid: string, folderName: string): Promise<ApiResponse<Folder>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse(false, null, uidValidation.error);

    const nameValidation = validateFolderName(folderName);
    if (!nameValidation.isValid) return createResponse(false, null, nameValidation.error);

    const trimmedName = folderName.trim();
    const docRef = await db.collection("users").doc(uid).collection("folders").add({
      name: trimmedName,
      createdAt: Date.now()
    });

    return createResponse(true, { id: docRef.id, name: trimmedName, createdAt: Date.now() } as Folder, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to add folder: ${error.message}`);
  }
}

export async function updateUserFolder(uid: string, folderId: string, newName: string): Promise<ApiResponse<Folder>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse(false, null, uidValidation.error);

    const nameValidation = validateFolderName(newName);
    if (!nameValidation.isValid) return createResponse(false, null, nameValidation.error);

    if (!folderId || typeof folderId !== 'string') {
      return createResponse(false, null, "Folder ID is required and must be a string");
    }

    const folderRef = db.collection("users").doc(uid).collection("folders").doc(folderId);
    const folderDoc = await folderRef.get();

    if (!folderDoc.exists) return createResponse(false, null, "Folder not found");

    await folderRef.update({ name: newName.trim() });
    const updatedDoc = await folderRef.get();
    return createResponse(true, { id: updatedDoc.id, ...updatedDoc.data() } as Folder, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to update folder: ${error.message}`);
  }
}

export async function deleteUserFolder(uid: string, folderId: string): Promise<ApiResponse<void>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse(false, null, uidValidation.error);

    if (!folderId || typeof folderId !== 'string') {
      return createResponse(false, null, "Folder ID is required and must be a string");
    }

    const folderRef = db.collection("users").doc(uid).collection("folders").doc(folderId);
    const folderDoc = await folderRef.get();

    if (!folderDoc.exists) return createResponse(false, null, "Folder not found");

    const papersSnapshot = await db.collection("users").doc(uid).collection("savedPapers")
      .where("folderId", "==", folderId).get();
    
    const batch = db.batch();
    papersSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { folderId: null });
    });
    batch.delete(folderRef);
    await batch.commit();

    return createResponse(true, undefined, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to delete folder: ${error.message}`);
  }
}

export async function getQueryHistory(uid: string, limit: number = 20): Promise<ApiResponse<QueryHistory[]>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse(false, null, validation.error);

    const snapshot = await db.collection("users").doc(uid).collection("queryHistory")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();
    
    const queries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueryHistory));
    return createResponse(true, queries, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to get query history: ${error.message}`);
  }
}

export async function addQueryHistory(uid: string, queryData: QueryHistoryInput): Promise<ApiResponse<QueryHistory>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse(false, null, uidValidation.error);

    if (!queryData.query || typeof queryData.query !== 'string') {
      return createResponse(false, null, "Query text is required");
    }

    const docRef = await db.collection("users").doc(uid).collection("queryHistory").add({
      query: queryData.query.trim(),
      type: queryData.type || "keyword",
      resultCount: queryData.resultCount || 0,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    });

    return createResponse(true, { id: docRef.id, ...queryData, timestamp: Date.now() } as QueryHistory, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to add query history: ${error.message}`);
  }
}

export async function clearQueryHistory(uid: string): Promise<ApiResponse<void>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse(false, null, validation.error);

    const snapshot = await db.collection("users").doc(uid).collection("queryHistory").get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return createResponse(true, undefined, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to clear query history: ${error.message}`);
  }
}

export async function getUserData(uid: string): Promise<ApiResponse<User>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse(false, null, validation.error);

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return createResponse(false, null, "User not found");

    return createResponse(true, { id: userDoc.id, ...userDoc.data() } as User, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to get user data: ${error.message}`);
  }
}

export async function upsertUser(uid: string, userData: Omit<UserInput, 'id'>): Promise<ApiResponse<User>> {
  try {
    const userRef = db.collection("users").doc(uid);
    await userRef.set({
      email: userData.email || '',
      displayName: userData.displayName || '',
      role: userData.role || 'user',
      updatedAt: Date.now()
    }, { merge: true });

    const userDoc = await userRef.get();
    return createResponse(true, { id: userDoc.id, ...userDoc.data() } as User, null);
  } catch (error: any) {
    return createResponse(false, null, `Failed to upsert user: ${error.message}`);
  }
}


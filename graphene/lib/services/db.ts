import { db } from '../auth/firestore';
import { createResponse, validateUserId, validatePaperData, validatePaperUpdate, validateFolderName } from '../models/validation';
import { ApiResponse, Paper, PaperInput, Folder, QueryHistory, QueryHistoryInput, User, UserInput } from '../models/types';

/**
 * Sanitizes a paper ID for use as a Firestore document ID.
 * Firestore document IDs cannot contain forward slashes, backslashes, or certain special characters.
 */
function sanitizePaperId(paperId: string): string {
  // Replace invalid characters with underscores
  // Firestore doesn't allow: /, \, spaces, and certain control characters
  return paperId
    .replace(/\/\//g, '_')  // Replace double slashes
    .replace(/\//g, '_')    // Replace single slashes
    .replace(/\\/g, '_')    // Replace backslashes
    .replace(/\s+/g, '_')   // Replace spaces
    .replace(/[^\w\-_.]/g, '_') // Replace any other invalid characters
    .substring(0, 1500);    // Firestore has a 1500 byte limit for document IDs
}

export async function getSavedPapers(uid: string): Promise<ApiResponse<Paper[]>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse<Paper[]>(false, undefined, validation.error);

    const snapshot = await db.collection("users").doc(uid).collection("savedPapers").get();
    const papers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Paper));
    papers.sort((a, b) => ((b.createdAt as number) || 0) - ((a.createdAt as number) || 0));
    return createResponse(true, papers, null);
  } catch (error: any) {
    return createResponse<Paper[]>(false, undefined, `Failed to get saved papers: ${error.message}`);
  }
}

export async function addSavedPaper(uid: string, paperData: PaperInput): Promise<ApiResponse<Paper>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<Paper>(false, undefined, uidValidation.error);

    const dataValidation = validatePaperData(paperData);
    if (!dataValidation.isValid) return createResponse<Paper>(false, undefined, dataValidation.error);

    const docRef = await db.collection("users").doc(uid).collection("savedPapers").add({
      ...paperData,
      starred: paperData.starred ?? false,
      folderId: paperData.folderId ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return createResponse(true, { id: docRef.id, ...paperData, starred: paperData.starred ?? false, folderId: paperData.folderId ?? null } as Paper, null);
  } catch (error: any) {
    return createResponse<Paper>(false, undefined, `Failed to add paper: ${error.message}`);
  }
}

export async function updateSavedPaper(uid: string, paperId: string, updateData: Partial<Paper>): Promise<ApiResponse<Paper>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<Paper>(false, undefined, uidValidation.error);

    if (!paperId || typeof paperId !== 'string') {
      return createResponse<Paper>(false, undefined, "Paper ID is required and must be a string");
    }

    const updateValidation = validatePaperUpdate(updateData);
    if (!updateValidation.isValid) return createResponse<Paper>(false, undefined, updateValidation.error);

    const paperRef = db.collection("users").doc(uid).collection("savedPapers").doc(paperId);
    const paperDoc = await paperRef.get();

    if (!paperDoc.exists) return createResponse<Paper>(false, undefined, "Paper not found");

    await paperRef.update({ ...updateData, updatedAt: Date.now() });
    const updatedDoc = await paperRef.get();
    return createResponse(true, { id: updatedDoc.id, ...updatedDoc.data() } as Paper, null);
  } catch (error: any) {
    return createResponse<Paper>(false, undefined, `Failed to update paper: ${error.message}`);
  }
}

export async function deleteSavedPaper(uid: string, paperId: string): Promise<ApiResponse<void>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<void>(false, undefined, uidValidation.error);

    if (!paperId || typeof paperId !== 'string') {
      return createResponse<void>(false, undefined, "Paper ID is required and must be a string");
    }

    const paperRef = db.collection("users").doc(uid).collection("savedPapers").doc(paperId);
    const paperDoc = await paperRef.get();

    if (!paperDoc.exists) return createResponse<void>(false, undefined, "Paper not found");

    await paperRef.delete();
    return createResponse(true, undefined, null);
  } catch (error: any) {
    return createResponse<void>(false, undefined, `Failed to delete paper: ${error.message}`);
  }
}

export async function getUserFolders(uid: string): Promise<ApiResponse<Folder[]>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse<Folder[]>(false, undefined, validation.error);

    const snapshot = await db.collection("users").doc(uid).collection("folders").get();
    const folders = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Folder));
    return createResponse(true, folders, null);
  } catch (error: any) {
    return createResponse<Folder[]>(false, undefined, `Failed to get folders: ${error.message}`);
  }
}

export async function addUserFolder(uid: string, folderName: string): Promise<ApiResponse<Folder>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<Folder>(false, undefined, uidValidation.error);

    const nameValidation = validateFolderName(folderName);
    if (!nameValidation.isValid) return createResponse<Folder>(false, undefined, nameValidation.error);

    const trimmedName = folderName.trim();
    const docRef = await db.collection("users").doc(uid).collection("folders").add({
      name: trimmedName,
      createdAt: Date.now()
    });

    return createResponse(true, { id: docRef.id, name: trimmedName, createdAt: Date.now() } as Folder, null);
  } catch (error: any) {
    return createResponse<Folder>(false, undefined, `Failed to add folder: ${error.message}`);
  }
}

export async function updateUserFolder(uid: string, folderId: string, newName: string): Promise<ApiResponse<Folder>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<Folder>(false, undefined, uidValidation.error);

    const nameValidation = validateFolderName(newName);
    if (!nameValidation.isValid) return createResponse<Folder>(false, undefined, nameValidation.error);

    if (!folderId || typeof folderId !== 'string') {
      return createResponse<Folder>(false, undefined, "Folder ID is required and must be a string");
    }

    const folderRef = db.collection("users").doc(uid).collection("folders").doc(folderId);
    const folderDoc = await folderRef.get();

    if (!folderDoc.exists) return createResponse<Folder>(false, undefined, "Folder not found");

    await folderRef.update({ name: newName.trim() });
    const updatedDoc = await folderRef.get();
    return createResponse(true, { id: updatedDoc.id, ...updatedDoc.data() } as Folder, null);
  } catch (error: any) {
    return createResponse<Folder>(false, undefined, `Failed to update folder: ${error.message}`);
  }
}

export async function deleteUserFolder(uid: string, folderId: string): Promise<ApiResponse<void>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<void>(false, undefined, uidValidation.error);

    if (!folderId || typeof folderId !== 'string') {
      return createResponse<void>(false, undefined, "Folder ID is required and must be a string");
    }

    const folderRef = db.collection("users").doc(uid).collection("folders").doc(folderId);
    const folderDoc = await folderRef.get();

    if (!folderDoc.exists) return createResponse<void>(false, undefined, "Folder not found");

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
    return createResponse<void>(false, undefined, `Failed to delete folder: ${error.message}`);
  }
}

export async function getQueryHistory(uid: string, limit: number = 20): Promise<ApiResponse<QueryHistory[]>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse<QueryHistory[]>(false, undefined, validation.error);

    const snapshot = await db.collection("users").doc(uid).collection("queryHistory")
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();
    
    const queries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueryHistory));
    return createResponse(true, queries, null);
  } catch (error: any) {
    return createResponse<QueryHistory[]>(false, undefined, `Failed to get query history: ${error.message}`);
  }
}

export async function addQueryHistory(uid: string, queryData: QueryHistoryInput): Promise<ApiResponse<QueryHistory>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<QueryHistory>(false, undefined, uidValidation.error);

    if (!queryData.query || typeof queryData.query !== 'string') {
      return createResponse<QueryHistory>(false, undefined, "Query text is required");
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
    return createResponse<QueryHistory>(false, undefined, `Failed to add query history: ${error.message}`);
  }
}

export async function clearQueryHistory(uid: string): Promise<ApiResponse<void>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse<void>(false, undefined, validation.error);

    const snapshot = await db.collection("users").doc(uid).collection("queryHistory").get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    return createResponse(true, undefined, null);
  } catch (error: any) {
    return createResponse<void>(false, undefined, `Failed to clear query history: ${error.message}`);
  }
}

export async function getUserData(uid: string): Promise<ApiResponse<User>> {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) return createResponse<User>(false, undefined, validation.error);

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) return createResponse<User>(false, undefined, "User not found");

    return createResponse(true, { id: userDoc.id, ...userDoc.data() } as User, null);
  } catch (error: any) {
    return createResponse<User>(false, undefined, `Failed to get user data: ${error.message}`);
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
    return createResponse<User>(false, undefined, `Failed to upsert user: ${error.message}`);
  }
}

export async function getPaperSummary(uid: string, paperId: string): Promise<ApiResponse<string | null>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<string | null>(false, undefined, uidValidation.error);

    if (!paperId || typeof paperId !== 'string') {
      return createResponse<string | null>(false, undefined, "Paper ID is required and must be a string");
    }

    const sanitizedId = sanitizePaperId(paperId);
    const summaryDoc = await db.collection("users").doc(uid).collection("paperSummaries").doc(sanitizedId).get();
    
    if (!summaryDoc.exists) {
      return createResponse(true, null, null);
    }

    const data = summaryDoc.data();
    return createResponse(true, data?.summary || null, null);
  } catch (error: any) {
    return createResponse<string | null>(false, undefined, `Failed to get paper summary: ${error.message}`);
  }
}

export async function savePaperSummary(uid: string, paperId: string, summary: string): Promise<ApiResponse<void>> {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) return createResponse<void>(false, undefined, uidValidation.error);

    if (!paperId || typeof paperId !== 'string') {
      return createResponse<void>(false, undefined, "Paper ID is required and must be a string");
    }

    if (!summary || typeof summary !== 'string') {
      return createResponse<void>(false, undefined, "Summary is required and must be a string");
    }

    const sanitizedId = sanitizePaperId(paperId);
    await db.collection("users").doc(uid).collection("paperSummaries").doc(sanitizedId).set({
      summary: summary.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }, { merge: true });

    return createResponse(true, undefined, null);
  } catch (error: any) {
    return createResponse<void>(false, undefined, `Failed to save paper summary: ${error.message}`);
  }
}


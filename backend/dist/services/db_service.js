// Database service
import { db } from '../config/firebase.js';
import { validateUserId, validateFolderName, validatePaperData, validateQueryHistoryData, } from '../models/db.js';
// ========== USER OPERATIONS ==========
/**
 * Create a new user document
 * @param uid - User ID (Firebase Auth UID)
 * @param email - User email
 * @returns Created user object
 */
export async function createUser(uid, email) {
    validateUserId(uid);
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
        throw new Error('Email is required and must be a non-empty string');
    }
    const userData = {
        email: email.trim(),
        createdAt: Date.now(),
        preferences: {},
    };
    await db.collection('users').doc(uid).set(userData);
    return {
        id: uid,
        ...userData,
    };
}
/**
 * Get user data by UID
 * @param uid - User ID
 * @returns User object or null if not found
 */
export async function getUser(uid) {
    validateUserId(uid);
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        return null;
    }
    return {
        id: userDoc.id,
        ...userDoc.data(),
    };
}
/**
 * Update user preferences
 * @param uid - User ID
 * @param preferences - Preferences object to update
 */
export async function updateUserPreferences(uid, preferences) {
    validateUserId(uid);
    if (!preferences || typeof preferences !== 'object') {
        throw new Error('Preferences must be an object');
    }
    await db.collection('users').doc(uid).update({ preferences });
}
// ========== FOLDER OPERATIONS ==========
/**
 * Create a new folder for a user
 * @param uid - User ID
 * @param name - Folder name
 * @returns Created folder object
 */
export async function createFolder(uid, name) {
    validateUserId(uid);
    validateFolderName(name);
    const trimmedName = name.trim();
    const folderData = {
        name: trimmedName,
        createdAt: Date.now(),
    };
    const folderRef = await db
        .collection('users')
        .doc(uid)
        .collection('folders')
        .add(folderData);
    return {
        id: folderRef.id,
        ...folderData,
    };
}
/**
 * Get all folders for a user
 * @param uid - User ID
 * @returns Array of folder objects
 */
export async function getFolders(uid) {
    validateUserId(uid);
    const snapshot = await db
        .collection('users')
        .doc(uid)
        .collection('folders')
        .get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}
/**
 * Update folder name
 * @param uid - User ID
 * @param folderId - Folder ID
 * @param name - New folder name
 * @returns Updated folder object
 */
export async function updateFolder(uid, folderId, name) {
    validateUserId(uid);
    validateFolderName(name);
    if (!folderId || typeof folderId !== 'string') {
        throw new Error('Folder ID is required and must be a string');
    }
    const folderRef = db
        .collection('users')
        .doc(uid)
        .collection('folders')
        .doc(folderId);
    const folderDoc = await folderRef.get();
    if (!folderDoc.exists) {
        throw new Error('Folder not found');
    }
    const trimmedName = name.trim();
    await folderRef.update({ name: trimmedName });
    const updatedDoc = await folderRef.get();
    return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
    };
}
/**
 * Delete a folder
 * @param uid - User ID
 * @param folderId - Folder ID
 */
export async function deleteFolder(uid, folderId) {
    validateUserId(uid);
    if (!folderId || typeof folderId !== 'string') {
        throw new Error('Folder ID is required and must be a string');
    }
    const folderRef = db
        .collection('users')
        .doc(uid)
        .collection('folders')
        .doc(folderId);
    const folderDoc = await folderRef.get();
    if (!folderDoc.exists) {
        throw new Error('Folder not found');
    }
    await folderRef.delete();
}
// ========== SAVED PAPER OPERATIONS ==========
/**
 * Create a new saved paper
 * @param uid - User ID
 * @param paperData - Paper data (without id, createdAt, updatedAt)
 * @returns Created saved paper object
 */
export async function createSavedPaper(uid, paperData) {
    validateUserId(uid);
    validatePaperData(paperData);
    const now = Date.now();
    const savedPaperData = {
        ...paperData,
        starred: paperData.starred ?? false,
        folderId: paperData.folderId ?? null,
        createdAt: now,
        updatedAt: now,
    };
    const paperRef = await db
        .collection('users')
        .doc(uid)
        .collection('savedPapers')
        .add(savedPaperData);
    return {
        id: paperRef.id,
        ...savedPaperData,
    };
}
/**
 * Get all saved papers for a user
 * @param uid - User ID
 * @returns Array of saved paper objects (sorted by createdAt descending)
 */
export async function getSavedPapers(uid) {
    validateUserId(uid);
    const snapshot = await db
        .collection('users')
        .doc(uid)
        .collection('savedPapers')
        .orderBy('createdAt', 'desc')
        .get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}
/**
 * Update a saved paper
 * @param uid - User ID
 * @param paperId - Paper ID
 * @param updateData - Partial paper data to update
 * @returns Updated saved paper object
 */
export async function updateSavedPaper(uid, paperId, updateData) {
    validateUserId(uid);
    if (!paperId || typeof paperId !== 'string') {
        throw new Error('Paper ID is required and must be a string');
    }
    if (!updateData || typeof updateData !== 'object') {
        throw new Error('Update data is required and must be an object');
    }
    // Validate that at least one field is being updated
    const allowedFields = [
        'title',
        'authors',
        'link',
        'summary',
        'published',
        'source',
        'similarity',
        'paper_id',
        'starred',
        'folderId',
    ];
    const providedFields = Object.keys(updateData);
    const hasValidField = providedFields.some((field) => allowedFields.includes(field));
    if (!hasValidField) {
        throw new Error(`At least one of the following fields must be provided: ${allowedFields.join(', ')}`);
    }
    // Validate individual fields if provided
    if (updateData.title !== undefined && (typeof updateData.title !== 'string' || updateData.title.trim().length === 0)) {
        throw new Error('title must be a non-empty string');
    }
    if (updateData.authors !== undefined && (!Array.isArray(updateData.authors) || updateData.authors.length === 0)) {
        throw new Error('authors must be a non-empty array');
    }
    if (updateData.link !== undefined && (typeof updateData.link !== 'string' || updateData.link.trim().length === 0)) {
        throw new Error('link must be a non-empty string');
    }
    if (updateData.starred !== undefined && typeof updateData.starred !== 'boolean') {
        throw new Error('starred must be a boolean');
    }
    if (updateData.folderId !== undefined && updateData.folderId !== null && typeof updateData.folderId !== 'string') {
        throw new Error('folderId must be a string or null');
    }
    if (updateData.summary !== undefined && typeof updateData.summary !== 'string') {
        throw new Error('summary must be a string');
    }
    if (updateData.published !== undefined && typeof updateData.published !== 'string') {
        throw new Error('published must be a string');
    }
    if (updateData.source !== undefined && typeof updateData.source !== 'string') {
        throw new Error('source must be a string');
    }
    if (updateData.similarity !== undefined && typeof updateData.similarity !== 'number') {
        throw new Error('similarity must be a number');
    }
    if (updateData.paper_id !== undefined && typeof updateData.paper_id !== 'string') {
        throw new Error('paper_id must be a string');
    }
    const paperRef = db
        .collection('users')
        .doc(uid)
        .collection('savedPapers')
        .doc(paperId);
    const paperDoc = await paperRef.get();
    if (!paperDoc.exists) {
        throw new Error('Paper not found');
    }
    // Update with new data and updatedAt timestamp
    await paperRef.update({
        ...updateData,
        updatedAt: Date.now(),
    });
    // Fetch updated paper
    const updatedDoc = await paperRef.get();
    return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
    };
}
/**
 * Delete a saved paper
 * @param uid - User ID
 * @param paperId - Paper ID
 */
export async function deleteSavedPaper(uid, paperId) {
    validateUserId(uid);
    if (!paperId || typeof paperId !== 'string') {
        throw new Error('Paper ID is required and must be a string');
    }
    const paperRef = db
        .collection('users')
        .doc(uid)
        .collection('savedPapers')
        .doc(paperId);
    const paperDoc = await paperRef.get();
    if (!paperDoc.exists) {
        throw new Error('Paper not found');
    }
    await paperRef.delete();
}
// ========== QUERY HISTORY OPERATIONS ==========
/**
 * Add a query to user's query history
 * @param uid - User ID
 * @param queryData - Query data (without id, timestamp, createdAt)
 * @returns Created query history object
 */
export async function addQueryHistory(uid, queryData) {
    validateUserId(uid);
    validateQueryHistoryData(queryData);
    const now = Date.now();
    const historyData = {
        query: queryData.query.trim(),
        type: queryData.type || 'keyword',
        resultCount: queryData.resultCount || 0,
        timestamp: now,
        createdAt: new Date().toISOString(),
    };
    const historyRef = await db
        .collection('users')
        .doc(uid)
        .collection('queryHistory')
        .add(historyData);
    return {
        id: historyRef.id,
        ...historyData,
    };
}
/**
 * Get query history for a user
 * @param uid - User ID
 * @param limit - Maximum number of queries to return (default: 20)
 * @returns Array of query history objects (sorted by timestamp descending)
 */
export async function getQueryHistory(uid, limit = 20) {
    validateUserId(uid);
    if (typeof limit !== 'number' || limit < 1) {
        throw new Error('Limit must be a positive number');
    }
    const snapshot = await db
        .collection('users')
        .doc(uid)
        .collection('queryHistory')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
}
/**
 * Clear all query history for a user
 * @param uid - User ID
 * @returns Number of deleted items
 */
export async function clearQueryHistory(uid) {
    validateUserId(uid);
    const snapshot = await db
        .collection('users')
        .doc(uid)
        .collection('queryHistory')
        .get();
    if (snapshot.empty) {
        return 0;
    }
    // Delete all documents in batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    return snapshot.docs.length;
}
//# sourceMappingURL=db_service.js.map
import { User, Folder, SavedPaper, QueryHistory } from '../models/db.js';
/**
 * Create a new user document
 * @param uid - User ID (Firebase Auth UID)
 * @param email - User email
 * @returns Created user object
 */
export declare function createUser(uid: string, email: string): Promise<User>;
/**
 * Get user data by UID
 * @param uid - User ID
 * @returns User object or null if not found
 */
export declare function getUser(uid: string): Promise<User | null>;
/**
 * Update user preferences
 * @param uid - User ID
 * @param preferences - Preferences object to update
 */
export declare function updateUserPreferences(uid: string, preferences: Record<string, any>): Promise<void>;
/**
 * Create a new folder for a user
 * @param uid - User ID
 * @param name - Folder name
 * @returns Created folder object
 */
export declare function createFolder(uid: string, name: string): Promise<Folder>;
/**
 * Get all folders for a user
 * @param uid - User ID
 * @returns Array of folder objects
 */
export declare function getFolders(uid: string): Promise<Folder[]>;
/**
 * Update folder name
 * @param uid - User ID
 * @param folderId - Folder ID
 * @param name - New folder name
 * @returns Updated folder object
 */
export declare function updateFolder(uid: string, folderId: string, name: string): Promise<Folder>;
/**
 * Delete a folder
 * @param uid - User ID
 * @param folderId - Folder ID
 */
export declare function deleteFolder(uid: string, folderId: string): Promise<void>;
/**
 * Create a new saved paper
 * @param uid - User ID
 * @param paperData - Paper data (without id, createdAt, updatedAt)
 * @returns Created saved paper object
 */
export declare function createSavedPaper(uid: string, paperData: Omit<SavedPaper, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedPaper>;
/**
 * Get all saved papers for a user
 * @param uid - User ID
 * @returns Array of saved paper objects (sorted by createdAt descending)
 */
export declare function getSavedPapers(uid: string): Promise<SavedPaper[]>;
/**
 * Update a saved paper
 * @param uid - User ID
 * @param paperId - Paper ID
 * @param updateData - Partial paper data to update
 * @returns Updated saved paper object
 */
export declare function updateSavedPaper(uid: string, paperId: string, updateData: Partial<SavedPaper>): Promise<SavedPaper>;
/**
 * Delete a saved paper
 * @param uid - User ID
 * @param paperId - Paper ID
 */
export declare function deleteSavedPaper(uid: string, paperId: string): Promise<void>;
/**
 * Add a query to user's query history
 * @param uid - User ID
 * @param queryData - Query data (without id, timestamp, createdAt)
 * @returns Created query history object
 */
export declare function addQueryHistory(uid: string, queryData: Omit<QueryHistory, 'id' | 'timestamp' | 'createdAt'>): Promise<QueryHistory>;
/**
 * Get query history for a user
 * @param uid - User ID
 * @param limit - Maximum number of queries to return (default: 20)
 * @returns Array of query history objects (sorted by timestamp descending)
 */
export declare function getQueryHistory(uid: string, limit?: number): Promise<QueryHistory[]>;
/**
 * Clear all query history for a user
 * @param uid - User ID
 * @returns Number of deleted items
 */
export declare function clearQueryHistory(uid: string): Promise<number>;
//# sourceMappingURL=db_service.d.ts.map
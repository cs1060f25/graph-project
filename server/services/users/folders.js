// server/services/users/folders.js
// Folder-related functions for the interface layer

import { db } from "./config/firebaseConfig.js";
import { createResponse, validateUserId, validateFolderName } from "./utils.js";
import { getFolders, addFolder, deleteFolder } from "./data/userDataService.js"

/**
 * Retrieves all folder data for a given user
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Standardized response with folders data
 */
export async function getUserFolders(uid) {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) {
      return createResponse(false, null, validation.error);
    }

    const folders = await getFolders(uid);
    return createResponse(true, folders, null);
  } catch (error) {
    console.error("Error getting user folders:", error);
    return createResponse(false, null, `Failed to get folders: ${error.message}`);
  }
}

/**
 * Helper function to add a new folder (extends existing functionality)
 * @param {string} uid - User ID
 * @param {string} folderName - Name of the folder to create
 * @returns {Promise<Object>} Standardized response with folder data
 */
export async function addUserFolder(uid, folderName) {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) {
      return createResponse(false, null, uidValidation.error);
    }

    const nameValidation = validateFolderName(folderName);
    if (!nameValidation.isValid) {
      return createResponse(false, null, nameValidation.error);
    }

    const newFolder = await addFolder(uid, folderName.trim());
    return createResponse(true, newFolder, null);
  } catch (error) {
    console.error("Error adding folder:", error);
    return createResponse(false, null, `Failed to add folder: ${error.message}`);
  }
}


/**
 * Delete a folder
 * @param {string} uid - User ID
 * @param {string} folderId - ID of the folder to delete
 * @returns {Promise<Object>} Standardized response with deletion confirmation
 */
export async function deleteUserFolder(uid, folderId) {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) {
      return createResponse(false, null, uidValidation.error);
    }

    // Validate folder ID
    if (!folderId || typeof folderId !== 'string' || folderId.trim().length === 0) {
      return createResponse(false, null, 'Folder ID is required');
    }

    const result = await deleteFolder(uid, folderId.trim());
    return createResponse(true, result, null);
  } catch (error) {
    console.error("Error deleting folder:", error);
    
    // Handle "not found" error specifically
    if (error.message === 'Folder not found') {
      return createResponse(false, null, 'Folder not found');
    }
    
    return createResponse(false, null, `Failed to delete folder: ${error.message}`);
  }
}


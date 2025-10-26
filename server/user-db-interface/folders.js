// user-db-interface/folders.js
// Folder-related functions for the interface layer

import { db } from "../user-db/firebaseConfig.js";
import { getFolders, addFolder } from "../user-db/userDataService.js";
import { createResponse, validateUserId, validateFolderName } from "./utils.js";

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

    await addFolder(uid, folderName.trim());
    return createResponse(true, { name: folderName.trim(), createdAt: Date.now() }, null);
  } catch (error) {
    console.error("Error adding folder:", error);
    return createResponse(false, null, `Failed to add folder: ${error.message}`);
  }
}

// user-db-interface/papers.js
// Saved papers functions for the interface layer

import { db } from "../user-db-component/firebaseConfig.js";
import { createResponse, validateUserId, validatePaperData, validatePaperUpdate } from "./utils.js";
import { updatePaperReadStatus } from "../user-db-component/userDataService.js";

/**
 * Adds a paper to the user's saved papers collection
 * @param {string} uid - User ID
 * @param {Object} paperData - Paper data object with title, authors, link, etc.
 * @returns {Promise<Object>} Standardized response with paper ID
 */
export async function addSavedPaper(uid, paperData) {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) {
      return createResponse(false, null, uidValidation.error);
    }

    const dataValidation = validatePaperData(paperData);
    if (!dataValidation.isValid) {
      return createResponse(false, null, dataValidation.error);
    }

    const savedPapersRef = db.collection("users").doc(uid).collection("savedPapers");
    const docRef = await savedPapersRef.add({
      ...paperData,
      starred: paperData.starred ?? false,
      folderId: paperData.folderId ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return createResponse(true, { id: docRef.id, ...paperData, starred: paperData.starred ?? false, folderId: paperData.folderId ?? null }, null);
  } catch (error) {
    console.error("Error adding saved paper:", error);
    return createResponse(false, null, `Failed to add paper: ${error.message}`);
  }
}

/**
 * Updates a saved paper
 * @param {string} uid - User ID
 * @param {string} paperId - Paper ID
 * @param {Object} updateData - Fields to update (partial update allowed)
 * @returns {Promise<Object>} Standardized response with updated paper data
 */
export async function updateSavedPaper(uid, paperId, updateData) {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) {
      return createResponse(false, null, uidValidation.error);
    }

    if (!paperId || typeof paperId !== 'string') {
      return createResponse(false, null, "Paper ID is required and must be a string");
    }

    const updateValidation = validatePaperUpdate(updateData);
    if (!updateValidation.isValid) {
      return createResponse(false, null, updateValidation.error);
    }

    const paperRef = db.collection("users").doc(uid).collection("savedPapers").doc(paperId);
    const paperDoc = await paperRef.get();

    if (!paperDoc.exists) {
      return createResponse(false, null, "Paper not found");
    }

    // Update the paper with new data and updatedAt timestamp
    await paperRef.update({
      ...updateData,
      updatedAt: Date.now()
    });

    // Fetch updated paper
    const updatedDoc = await paperRef.get();
    const updatedPaper = { id: updatedDoc.id, ...updatedDoc.data() };

    return createResponse(true, updatedPaper, null);
  } catch (error) {
    console.error("Error updating saved paper:", error);
    return createResponse(false, null, `Failed to update paper: ${error.message}`);
  }
}

/**
 * Deletes a saved paper
 * @param {string} uid - User ID
 * @param {string} paperId - Paper ID
 * @returns {Promise<Object>} Standardized response
 */
export async function deleteSavedPaper(uid, paperId) {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) {
      return createResponse(false, null, uidValidation.error);
    }

    if (!paperId || typeof paperId !== 'string') {
      return createResponse(false, null, "Paper ID is required and must be a string");
    }

    const paperRef = db.collection("users").doc(uid).collection("savedPapers").doc(paperId);
    const paperDoc = await paperRef.get();

    if (!paperDoc.exists) {
      return createResponse(false, null, "Paper not found");
    }

    await paperRef.delete();

    return createResponse(true, { deleted: true }, null);
  } catch (error) {
    console.error("Error deleting saved paper:", error);
    return createResponse(false, null, `Failed to delete paper: ${error.message}`);
  }
}

/**
 * Retrieves all saved papers for a given user
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Standardized response with saved papers data
 */
export async function getSavedPapers(uid) {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) {
      return createResponse(false, null, validation.error);
    }

    const savedPapersRef = db.collection("users").doc(uid).collection("savedPapers");
    const snapshot = await savedPapersRef.get();
    const papers = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    // Sort by creation date (newest first)
    papers.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return createResponse(true, papers, null);
  } catch (error) {
    console.error("Error getting saved papers:", error);
    return createResponse(false, null, `Failed to get saved papers: ${error.message}`);
  }
}


/** * Updates the read status of a saved paper
 * @param {string} uid - User ID
 * @param {string} paperId - Paper ID
 * @param {string} readStatus - New read status
 * @returns {Promise<Object>} Standardized response with updated paper data
 */
export async function updateUserPaperReadStatus(uid, paperId, readStatus) {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) {
      return createResponse(false, null, validation.error);
    }

    const result = await updatePaperReadStatus(uid, paperId, readStatus);
    return createResponse(true, result, null);
  } catch (error) {
    console.error("Error updating paper read status:", error);
    return createResponse(false, null, `Failed to update read status: ${error.message}`);
  }
}
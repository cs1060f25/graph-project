// user-db-interface/papers.js
// Saved papers functions for the interface layer

import { db } from "../user-db/firebaseConfig.js";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore";
import { createResponse, validateUserId, validatePaperData } from "./utils.js";

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

    const savedPapersRef = collection(db, "users", uid, "savedPapers");
    const docRef = await addDoc(savedPapersRef, {
      ...paperData,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    return createResponse(true, { id: docRef.id, ...paperData }, null);
  } catch (error) {
    console.error("Error adding saved paper:", error);
    return createResponse(false, null, `Failed to add paper: ${error.message}`);
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

    const savedPapersRef = collection(db, "users", uid, "savedPapers");
    const snapshot = await getDocs(savedPapersRef);
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

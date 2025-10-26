// user-db-interface/subscriptions.js
// Real-time subscription functions for the interface layer

import { db } from "../user-db-component/firebaseConfig.js";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { createResponse, validateUserId, validateCallback } from "./utils.js";

/**
 * Sets up a real-time listener for folder changes
 * @param {string} uid - User ID
 * @param {Function} onChangeCallback - Callback function to handle data changes
 * @returns {Function} Unsubscribe function to stop listening
 */
export function subscribeToFolders(uid, onChangeCallback) {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) {
      console.error(uidValidation.error);
      return () => {};
    }

    const callbackValidation = validateCallback(onChangeCallback, "onChangeCallback");
    if (!callbackValidation.isValid) {
      console.error(callbackValidation.error);
      return () => {};
    }

    const foldersRef = collection(db, "users", uid, "folders");
    const q = query(foldersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const folders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Call the callback with standardized response and error handling
        try {
          onChangeCallback(createResponse(true, folders, null));
        } catch (callbackError) {
          console.error("Error in folder subscription callback:", callbackError);
          // Don't re-throw to prevent subscription from breaking
        }
      },
      (error) => {
        console.error("Error in folder subscription:", error);
        try {
          onChangeCallback(createResponse(false, null, `Folder subscription error: ${error.message}`));
        } catch (callbackError) {
          console.error("Error in folder subscription error callback:", callbackError);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up folder subscription:", error);
    try {
      onChangeCallback(createResponse(false, null, `Failed to setup folder subscription: ${error.message}`));
    } catch (callbackError) {
      console.error("Error in folder subscription setup error callback:", callbackError);
    }
    return () => {};
  }
}

/**
 * Sets up a real-time listener for saved papers changes
 * @param {string} uid - User ID
 * @param {Function} onChangeCallback - Callback function to handle data changes
 * @returns {Function} Unsubscribe function to stop listening
 */
export function subscribeToSavedPapers(uid, onChangeCallback) {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) {
      console.error(uidValidation.error);
      return () => {};
    }

    const callbackValidation = validateCallback(onChangeCallback, "onChangeCallback");
    if (!callbackValidation.isValid) {
      console.error(callbackValidation.error);
      return () => {};
    }

    const savedPapersRef = collection(db, "users", uid, "savedPapers");
    const q = query(savedPapersRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const papers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Call the callback with standardized response and error handling
        try {
          onChangeCallback(createResponse(true, papers, null));
        } catch (callbackError) {
          console.error("Error in saved papers subscription callback:", callbackError);
          // Don't re-throw to prevent subscription from breaking
        }
      },
      (error) => {
        console.error("Error in saved papers subscription:", error);
        try {
          onChangeCallback(createResponse(false, null, `Saved papers subscription error: ${error.message}`));
        } catch (callbackError) {
          console.error("Error in saved papers subscription error callback:", callbackError);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up saved papers subscription:", error);
    try {
      onChangeCallback(createResponse(false, null, `Failed to setup saved papers subscription: ${error.message}`));
    } catch (callbackError) {
      console.error("Error in saved papers subscription setup error callback:", callbackError);
    }
    return () => {};
  }
}

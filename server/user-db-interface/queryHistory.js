// server/user-db-interface/queryHistory.js
// Query history functions for the interface layer

import { db } from "../user-db-component/firebaseConfig.js";
import { createResponse, validateUserId } from "./utils.js";

/**
 * Adds a query to the user's search history
 * @param {string} uid - User ID
 * @param {Object} queryData - Query data object
 * @param {string} queryData.query - Search query text
 * @param {string} queryData.type - Query type (keyword, topic)
 * @param {number} queryData.resultCount - Number of results returned
 * @returns {Promise<Object>} Standardized response with query ID
 */
export async function addQueryHistory(uid, queryData) {
  try {
    const uidValidation = validateUserId(uid);
    if (!uidValidation.isValid) {
      return createResponse(false, null, uidValidation.error);
    }

    if (!queryData.query || typeof queryData.query !== 'string') {
      return createResponse(false, null, "Query text is required");
    }

    const queryHistoryRef = db.collection("users").doc(uid).collection("queryHistory");
    
    // Prepare the document data
    const docData = {
      query: queryData.query.trim(),
      type: queryData.type || "keyword",
      resultCount: queryData.resultCount || 0,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };
    
    const docRef = await queryHistoryRef.add(docData);

    // Return the complete saved data including timestamp
    return createResponse(true, { id: docRef.id, ...docData }, null);
  } catch (error) {
    console.error("Error adding query history:", error);
    return createResponse(false, null, `Failed to add query history: ${error.message}`);
  }
}

/**
 * Retrieves recent query history for a given user
 * @param {string} uid - User ID
 * @param {number} limitCount - Maximum number of queries to return (default: 20)
 * @returns {Promise<Object>} Standardized response with query history data
 */
export async function getQueryHistory(uid, limitCount = 20) {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) {
      return createResponse(false, null, validation.error);
    }

    const queryHistoryRef = db.collection("users").doc(uid).collection("queryHistory");
    const snapshot = await queryHistoryRef
      .orderBy("timestamp", "desc")
      .limit(limitCount)
      .get();
    
    const queries = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    }));

    return createResponse(true, queries, null);
  } catch (error) {
    console.error("Error getting query history:", error);
    return createResponse(false, null, `Failed to get query history: ${error.message}`);
  }
}

/**
 * Clears all query history for a user
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Standardized response
 */
export async function clearQueryHistory(uid) {
  try {
    const validation = validateUserId(uid);
    if (!validation.isValid) {
      return createResponse(false, null, validation.error);
    }

    const queryHistoryRef = db.collection("users").doc(uid).collection("queryHistory");
    const snapshot = await queryHistoryRef.get();
    
    // Delete all documents in batch
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();

    return createResponse(true, { deletedCount: snapshot.docs.length }, null);
  } catch (error) {
    console.error("Error clearing query history:", error);
    return createResponse(false, null, `Failed to clear query history: ${error.message}`);
  }
}

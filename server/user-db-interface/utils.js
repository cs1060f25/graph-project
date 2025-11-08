// user-db-interface/utils.js
// Shared utility functions for the interface layer

/**
 * Standardized response format for all API functions
 * @param {boolean} success - Whether the operation was successful
 * @param {any} data - The data payload (null if error)
 * @param {string|null} error - Error message (null if success)
 * @returns {Object} Standardized response object
 */
export function createResponse(success, data = null, error = null) {
  return { success, data, error };
}

/**
 * Validates that a user ID is provided and is a non-empty string
 * @param {string} uid - User ID to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validateUserId(uid) {
  if (!uid) {
    return { isValid: false, error: "User ID is required" };
  }
  
  if (typeof uid !== 'string' || uid.trim().length === 0) {
    return { isValid: false, error: "User ID must be a non-empty string" };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validates paper data object
 * @param {Object} paperData - Paper data to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validatePaperData(paperData) {
  if (!paperData || typeof paperData !== 'object') {
    return { isValid: false, error: "Paper data is required and must be an object" };
  }

  const requiredFields = ['title', 'authors', 'link'];
  const missingFields = requiredFields.filter(field => !paperData[field]);
  
  if (missingFields.length > 0) {
    return { isValid: false, error: `Missing required fields: ${missingFields.join(', ')}` };
  }

  return { isValid: true, error: null };
}

/**
 * Validates folder name
 * @param {string} folderName - Folder name to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validateFolderName(folderName) {
  if (!folderName || typeof folderName !== 'string' || folderName.trim().length === 0) {
    return { isValid: false, error: "Folder name is required and must be a non-empty string" };
  }
  
  return { isValid: true, error: null };
}

/**
 * Validates callback function
 * @param {Function} callback - Callback function to validate
 * @param {string} functionName - Name of the function for error messages
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validateCallback(callback, functionName = "callback") {
  if (typeof callback !== 'function') {
    return { isValid: false, error: `${functionName} must be a function` };
  }
  
  return { isValid: true, error: null };
}

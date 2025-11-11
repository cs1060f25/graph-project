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

  // Validate optional fields if provided
  if (paperData.starred !== undefined && typeof paperData.starred !== 'boolean') {
    return { isValid: false, error: "starred must be a boolean" };
  }

  if (paperData.folderId !== undefined && paperData.folderId !== null && typeof paperData.folderId !== 'string') {
    return { isValid: false, error: "folderId must be a string or null" };
  }

  if (paperData.abstract !== undefined && typeof paperData.abstract !== 'string') {
    return { isValid: false, error: "abstract must be a string" };
  }

  if (paperData.publishedDate !== undefined && paperData.publishedDate !== null && typeof paperData.publishedDate !== 'string' && typeof paperData.publishedDate !== 'number') {
    return { isValid: false, error: "publishedDate must be a string or number" };
  }

  return { isValid: true, error: null };
}

/**
 * Validates paper update data (allows partial updates)
 * @param {Object} updateData - Paper update data to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
export function validatePaperUpdate(updateData) {
  if (!updateData || typeof updateData !== 'object') {
    return { isValid: false, error: "Update data is required and must be an object" };
  }

  // At least one field must be provided
  const allowedFields = ['title', 'authors', 'link', 'abstract', 'publishedDate', 'starred', 'folderId'];
  const providedFields = Object.keys(updateData);
  const hasValidField = providedFields.some(field => allowedFields.includes(field));

  if (!hasValidField) {
    return { isValid: false, error: `At least one of the following fields must be provided: ${allowedFields.join(', ')}` };
  }

  // Validate each provided field
  if (updateData.title !== undefined && (!updateData.title || typeof updateData.title !== 'string')) {
    return { isValid: false, error: "title must be a non-empty string" };
  }

  if (updateData.authors !== undefined && (!Array.isArray(updateData.authors) || updateData.authors.length === 0)) {
    return { isValid: false, error: "authors must be a non-empty array" };
  }

  if (updateData.link !== undefined && (!updateData.link || typeof updateData.link !== 'string')) {
    return { isValid: false, error: "link must be a non-empty string" };
  }

  if (updateData.starred !== undefined && typeof updateData.starred !== 'boolean') {
    return { isValid: false, error: "starred must be a boolean" };
  }

  if (updateData.folderId !== undefined && updateData.folderId !== null && typeof updateData.folderId !== 'string') {
    return { isValid: false, error: "folderId must be a string or null" };
  }

  if (updateData.abstract !== undefined && typeof updateData.abstract !== 'string') {
    return { isValid: false, error: "abstract must be a string" };
  }

  if (updateData.publishedDate !== undefined && updateData.publishedDate !== null && typeof updateData.publishedDate !== 'string' && typeof updateData.publishedDate !== 'number') {
    return { isValid: false, error: "publishedDate must be a string or number" };
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

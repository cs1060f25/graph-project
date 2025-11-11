import { auth } from '../config/firebase';

// client/src/services/userApi.js
// API client for user-related endpoints

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Helper function to make API requests with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const headers = await options.headers;
  const newHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: newHeaders,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

/**
 * Get authentication token from Firebase Auth
 * 
 * Firebase ID tokens:
 * - Expire after ~1 hour
 * - Automatically refreshed by Firebase SDK before expiration
 * - Use getIdToken() to get current token (refreshes if needed)
 * - Use getIdToken(true) to force refresh
 * 
 * @returns {Promise<string|null>} ID token or null if user not authenticated
 */
async function getAuthToken() {
  // Check if Firebase auth is configured
  if (!auth) {
    console.warn('Firebase auth is not configured');
    return null;
  }

  // Check if user is authenticated
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return null;
  }

  try {
    // getIdToken() automatically refreshes the token if it's expired or about to expire
    const idToken = await currentUser.getIdToken();
    return idToken;
  } catch (error) {
    console.error('Error getting ID token:', error);
    // Token might be invalid or user might have been signed out
    // Return null to indicate no valid token available
    return null;
  }
}

/**
 * Add auth header if token exists
 */
async function getAuthHeaders() {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ========================================
// USER API FUNCTIONS
// ========================================

export const userApi = {
  /**
   * Get current user info
   * @returns {Promise<Object>} User data
   */
  getCurrentUser: async () => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/user/me', {
      headers,
    });
    return response.data;
  },

  /**
   * Get user profile and preferences
   * @returns {Promise<Object>} User profile data
   */
  getUserData: async () => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/user/data', {
      headers,
    });
    return response.data;
  },

  // ========================================
  // PAPERS API
  // ========================================

  /**
   * Get all saved papers
   * @returns {Promise<Array>} Array of paper objects
   */
  getSavedPapers: async () => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/user/papers', {
      headers,
    });
    // Ensure we always return an array
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Save a new paper
   * @param {Object} paperData - Paper data to save
   * @param {string} paperData.title - Paper title
   * @param {Array<string>} paperData.authors - List of authors
   * @param {string} paperData.link - Paper URL
   * @param {string} [paperData.abstract] - Paper abstract
   * @param {string} [paperData.publishedDate] - Publication date
   * @param {string} [paperData.folderId] - Folder ID
   * @returns {Promise<Object>} Response object with { success: boolean, data: Object, error: string|null }
   */
  savePaper: async (paperData) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/user/papers', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(paperData),
    });
    // Backend returns { success, data, error } format
    return response;
  },

  /**
   * Update paper properties (star status, folder, etc.)
   * Note: This endpoint doesn't exist yet in the backend
   * You may need to add it or use patch
   * @param {string} paperId - Paper ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<Object>} Updated paper object
   */
  updatePaper: async (paperId, updates) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/api/user/papers/${paperId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(updates),
    });
    return response.data;
  },

  /**
   * Delete a paper
   * Note: This endpoint doesn't exist yet in the backend
   * You may need to add it
   * @param {string} paperId - Paper ID
   * @returns {Promise<void>}
   */
  deletePaper: async (paperId) => {
    const headers = await getAuthHeaders();
    await apiRequest(`/api/user/papers/${paperId}`, {
      method: 'DELETE',
      headers: headers,
    });
  },

  // ========================================
  // QUERY HISTORY API
  // ========================================

  /**
   * Get query history
   * @param {number} limit - Maximum number of queries to return (default: 20)
   * @returns {Promise<Array>} Array of query history objects
   */
  getQueryHistory: async (limit = 20) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/api/user/history?limit=${limit}`, {
      headers: headers,
    });
    return response.data;
  },

  /**
   * Add query to history
   * @param {Object} queryData - Query data
   * @param {string} queryData.query - Search query text
   * @param {string} queryData.type - Query type (keyword, topic)
   * @param {number} queryData.resultCount - Number of results returned
   * @returns {Promise<Object>} Created query history object
   */
  addQueryHistory: async (queryData) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/user/history', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(queryData),
    });
    return response.data;
  },

  /**
   * Clear all query history
   * @returns {Promise<void>}
   */
  clearQueryHistory: async () => {
    const headers = await getAuthHeaders();
    await apiRequest('/api/user/history', {
      method: 'DELETE',
      headers: headers,
    });
  },

  // ========================================
  // FOLDERS API
  // ========================================

  /**
   * Get all folders
   * @returns {Promise<Array>} Array of folder objects
   */
  getFolders: async () => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/user/folders', {
      headers,
    });
    // Ensure we always return an array
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Create a new folder
   * @param {string} folderName - Name of the folder
   * @returns {Promise<Object>} Created folder object
   */
  createFolder: async (folderName) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/user/folders', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: folderName }),
    });
    return response.data;
  },

  /**
   * Update folder name
   * Note: This endpoint doesn't exist yet in the backend
   * @param {string} folderId - Folder ID
   * @param {string} newName - New folder name
   * @returns {Promise<Object>} Updated folder object
   */
  updateFolder: async (folderId, newName) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/api/user/folders/${folderId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ name: newName }),
    });
    return response.data;
  },

  /**
   * Delete a folder
   * Note: This endpoint doesn't exist yet in the backend
   * @param {string} folderId - Folder ID
   * @returns {Promise<void>}
   */
  deleteFolder: async (folderId) => {
    const headers = await getAuthHeaders();
    await apiRequest(`/api/user/folders/${folderId}`, {
      method: 'DELETE',
      headers,
    });
  },
};

// Export individual functions for convenience
export const {
  getCurrentUser,
  getUserData,
  getSavedPapers,
  savePaper,
  updatePaper,
  deletePaper,
  getQueryHistory,
  addQueryHistory,
  clearQueryHistory,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
} = userApi;

export default userApi;
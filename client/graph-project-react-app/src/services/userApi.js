// client/src/services/userApi.js
// API client for user-related endpoints

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Helper function to make API requests with error handling
 */
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
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
 * Get authentication token from localStorage or your auth context
 * TODO: Replace this with your actual auth token retrieval logic
 */
function getAuthToken() {
  // For now, mock server doesn't need auth
  // When using real server, get token from your auth context:
  // return localStorage.getItem('authToken');
  // or from Firebase: await user.getIdToken();
  return null;
}

/**
 * Add auth header if token exists
 */
function getAuthHeaders() {
  const token = getAuthToken();
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
    const response = await apiRequest('/api/user/me', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Get user profile and preferences
   * @returns {Promise<Object>} User profile data
   */
  getUserData: async () => {
    const response = await apiRequest('/api/user/data', {
      headers: getAuthHeaders(),
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
    const response = await apiRequest('/api/user/papers', {
      headers: getAuthHeaders(),
    });
    return response.data;
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
   * @returns {Promise<Object>} Created paper object
   */
  savePaper: async (paperData) => {
    const response = await apiRequest('/api/user/papers', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paperData),
    });
    return response.data;
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
    const response = await apiRequest(`/api/user/papers/${paperId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
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
    await apiRequest(`/api/user/papers/${paperId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
    const response = await apiRequest(`/api/user/history?limit=${limit}`, {
      headers: getAuthHeaders(),
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
    const response = await apiRequest('/api/user/history', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(queryData),
    });
    return response.data;
  },

  /**
   * Clear all query history
   * @returns {Promise<void>}
   */
  clearQueryHistory: async () => {
    await apiRequest('/api/user/history', {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
    const response = await apiRequest('/api/user/folders', {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  /**
   * Create a new folder
   * @param {string} folderName - Name of the folder
   * @returns {Promise<Object>} Created folder object
   */
  createFolder: async (folderName) => {
    const response = await apiRequest('/api/user/folders', {
      method: 'POST',
      headers: getAuthHeaders(),
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
    const response = await apiRequest(`/api/user/folders/${folderId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
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
    await apiRequest(`/api/user/folders/${folderId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
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
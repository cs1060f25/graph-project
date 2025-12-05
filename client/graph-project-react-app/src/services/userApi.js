import { auth } from './firebaseClient';

// client/src/services/userApi.js
// API client for user-related endpoints

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

/**
 * Helper function to make API requests with error handling
 */
async function apiRequest(endpoint, options = {}) {
  // Headers are already awaited in each method, so they're objects, not promises
  const headers = options.headers || {};
  const newHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: newHeaders,
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    // Try to parse JSON, fallback to text if not JSON
    let data;
    try {
      const text = await response.text();
      data = isJson && text ? JSON.parse(text) : { error: text || 'Unknown error' };
    } catch (parseError) {
      console.error(`JSON parse error for ${endpoint}:`, parseError);
      data = { error: 'Invalid response format' };
    }

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
   * @param {string} paperId - Paper ID
   * @param {Object} updates - Properties to update
   * @returns {Promise<Object>} Response object with { success: boolean, data: Object, error: string|null }
   */
  updatePaper: async (paperId, updates) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/api/user/papers/${paperId}`, {
      method: 'PATCH',
      headers: headers,
      body: JSON.stringify(updates),
    });
    // Backend returns { success, data, error } format
    return response;
  },

  /**
   * Delete a paper
   * @param {string} paperId - Paper ID
   * @returns {Promise<Object>} Response object with { success: boolean, data: Object, error: string|null }
   */
  deletePaper: async (paperId) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest(`/api/user/papers/${paperId}`, {
      method: 'DELETE',
      headers: headers,
    });
    // Backend returns { success, data, error } format
    return response;
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
 * Delete a folder
 * @param {string} folderId - Folder ID to delete
 * @returns {Promise<Object>} Response with deletion confirmation
 */
deleteFolder: async (folderId) => {
  const headers = await getAuthHeaders();
  const response = await apiRequest(`/api/user/folders/${folderId}`, {
    method: 'DELETE',
    headers,
  });
  return response;
},
  // ========================================
  // PAPER SEARCH API
  // ========================================

  /**
   * Search for papers across all APIs
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {string} options.type - Query type: 'keyword', 'topic', or 'author'
   * @param {number} options.maxResults - Maximum number of results
   * @param {boolean} options.forceRefresh - Force refresh (skip cache)
   * @returns {Promise<Array>} Array of paper objects
   */
  searchPapers: async (query, options = {}) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/papers/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        type: options.type || 'keyword',
        maxResults: options.maxResults,
        forceRefresh: options.forceRefresh || false,
      }),
    });
    return response.data || [];
  },

  /**
   * Expand graph layer with related papers
   * @param {Object} params - Expansion parameters
   * @param {Array} params.currentLayerPapers - Papers in current layer
   * @param {Array} params.allExistingPapers - All existing papers
   * @param {string} [params.authorName] - Optional author name
   * @param {number} [params.maxPerPaper] - Max papers per source paper
   * @returns {Promise<Array>} New papers for the expanded layer
   */
  expandGraphLayer: async (params) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/papers/layers', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    return response.data || [];
  },

  // ========================================
  // AI SUMMARY API
  // ========================================

  /**
   * Generate AI summary for a paper (now calls backend)
   * @param {Object} paperData - Paper data
   * @param {string} paperData.title - Paper title
   * @param {Array<string>} paperData.authors - List of authors
   * @param {string} [paperData.summary] - Paper abstract/summary
   * @param {string} [paperData.abstract] - Paper abstract (alternative)
   * @param {number} [paperData.year] - Publication year
   * @param {number} [paperData.citations] - Citation count
   * @returns {Promise<{success: boolean, summary: string|null, error: string|null}>}
   */
  generatePaperSummary: async (paperData) => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/papers/summary', {
      method: 'POST',
      headers,
      body: JSON.stringify(paperData),
    });
    return {
      success: response.success || false,
      summary: response.summary || null,
      error: response.error || null,
    };
  },

  // ========================================
  // AUTH SYNC API
  // ========================================

  /**
   * Sync user data to Firestore (replaces frontend userService)
   * @param {string} token - Firebase ID token
   * @param {Object} additionalData - Additional user data (e.g., name from signup)
   * @returns {Promise<{success: boolean, isNewUser: boolean, role: string, error: string|null}>}
   */
  syncUser: async (token, additionalData = {}) => {
    const response = await apiRequest('/api/auth/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, additionalData }),
    });
    return {
      success: response.success || false,
      isNewUser: response.isNewUser || false,
      role: response.role || 'user',
      error: response.error || null,
    };
  },

  /**
   * Get a random "feeling lucky" research query
   * @returns {Promise<string>} A random research query
   */
  getFeelingLuckyQuery: async () => {
    const headers = await getAuthHeaders();
    const response = await apiRequest('/api/papers/feeling-lucky', {
      method: 'GET',
      headers,
    });
    return response.query || 'advanced research frontiers';
  },
};

// Export individual functions for convenience
export const {
  getSavedPapers,
  savePaper,
  updatePaper,
  deletePaper,
  getQueryHistory,
  addQueryHistory,
  clearQueryHistory,
  getFolders,
  createFolder,
  deleteFolder,
  searchPapers,
  expandGraphLayer,
  generatePaperSummary,
  syncUser,
  getFeelingLuckyQuery,
} = userApi;

export default userApi;
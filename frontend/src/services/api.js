const API_BASE_URL = '/api';

export const api = {
  // Get saved papers with optional filters
  getSavedPapers: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.author) params.append('author', filters.author);
    if (filters.keyword) params.append('keyword', filters.keyword);
    
    const url = `${API_BASE_URL}/papers/saved${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch saved papers');
    return response.json();
  },

  // Get paper by ID
  getPaperById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/papers/${id}`);
    if (!response.ok) throw new Error('Failed to fetch paper');
    return response.json();
  },

  // Get related papers
  getRelatedPapers: async (paperId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.author) params.append('author', filters.author);
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.limit) params.append('limit', filters.limit);
    
    const url = `${API_BASE_URL}/papers/related/${paperId}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch related papers');
    return response.json();
  },

  // Find similar papers
  findSimilarPapers: async (paperId) => {
    const response = await fetch(`${API_BASE_URL}/papers/${paperId}/similar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Failed to find similar papers');
    return response.json();
  },

  // Chat with AI
  chatSummarize: async (paperId, question) => {
    const response = await fetch(`${API_BASE_URL}/chat/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paperId, question }),
    });
    if (!response.ok) throw new Error('Failed to get AI response');
    return response.json();
  },
};
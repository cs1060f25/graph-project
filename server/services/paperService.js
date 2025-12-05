// server/services/paperService.js
// Business logic for paper operations

import APIHandlerService from './apiHandlers/APIHandlerService.js';

export default class PaperService {
  constructor() {
    this.apiHandler = new APIHandlerService({ maxResults: 10 });
  }

  /**
   * Search for papers across all APIs
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {string} options.type - Query type: 'keyword', 'topic', or 'author'
   * @param {number} options.maxResults - Maximum number of results
   * @param {boolean} options.forceRefresh - Force refresh (skip cache)
   * @returns {Promise<Array>} Array of paper objects
   */
  async searchPapers(query, options = {}) {
    try {
      const { type = 'keyword', maxResults, forceRefresh = false } = options;
      
      const results = await this.apiHandler.makeQuery(query, {
        type,
        maxResultsOverride: maxResults,
        forceRefresh,
      });

      return results;
    } catch (error) {
      console.error('[PaperService] Error searching papers:', error);
      throw error;
    }
  }
}


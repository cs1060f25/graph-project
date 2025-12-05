// server/services/apiHandlers/APIHandlerService.js
// Backend service to orchestrate external API calls

import ArxivAPI from './ArxivAPI.js';
import OpenAlexAPI from './OpenAlexAPI.js';
import CoreAPI from './CoreAPI.js';

export default class APIHandlerService {
  constructor({ maxResults = 5 } = {}) {
    this.apis = [
      new ArxivAPI({ defaultMaxResults: maxResults }),
      new OpenAlexAPI({ defaultMaxResults: maxResults }),
      new CoreAPI({ defaultMaxResults: maxResults }),
    ];
    this.maxResults = maxResults;
  }

  /**
   * Main query function - orchestrates all API calls
   * @param {string} query - Search query
   * @param {Object} options - Query options
   * @param {string} options.type - Query type: 'keyword', 'topic', or 'author'
   * @param {number} options.maxResultsOverride - Override default max results
   * @returns {Promise<Array>} Array of normalized paper objects
   */
  async makeQuery(query, options = { type: 'keyword', forceRefresh: false }) {
    const {
      type,
      forceRefresh = false,
      maxResultsOverride = null
    } = options;

    const limit = Number.isFinite(maxResultsOverride) && maxResultsOverride > 0
      ? maxResultsOverride
      : this.maxResults;

    // Run all API calls in parallel for better performance
    const apiPromises = this.apis.map(async (api) => {
      try {
        let results = [];
        if (type === 'topic' && typeof api.queryByTopic === 'function') {
          results = await api.queryByTopic(query, limit);
        } else if (type === 'author' && typeof api.queryByAuthor === 'function') {
          results = await api.queryByAuthor(query, limit);
        } else if (type === 'keyword' && typeof api.queryByKeyword === 'function') {
          results = await api.queryByKeyword(query, limit);
        }
        return results;
      } catch (err) {
        console.warn(`${api.constructor.name} failed:`, err.message);
        return []; // Return empty array on error
      }
    });

    // Wait for all API calls to complete (or timeout)
    const apiResults = await Promise.allSettled(apiPromises);
    const combinedResults = apiResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

    // Deduplicate by paper ID
    const uniqueResults = Object.values(
      combinedResults.reduce((acc, r) => {
        acc[r.id] = r;
        return acc;
      }, {})
    );

    return uniqueResults;
  }
}


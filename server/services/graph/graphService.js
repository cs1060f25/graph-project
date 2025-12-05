// server/services/graph/graphService.js
// Graph layer expansion logic (moved from frontend)

import APIHandlerService from '../papers/api/APIHandlerService.js';

export default class GraphService {
  constructor() {
    this.apiHandler = new APIHandlerService({ maxResults: 10 });
  }

  /**
   * Fetches related papers for a given paper ID
   * @param {string} paperId - The ID of the paper to get related papers for
   * @param {Array} existingPapers - Array of all existing papers in the graph
   * @param {number} maxResults - Maximum number of related papers to return
   * @returns {Promise<Array>} Array of related paper objects
   */
  async getRelatedPapers(paperId, existingPapers, maxResults = 5) {
    // Find the source paper
    const sourcePaper = existingPapers.find(p => p.id === paperId);
    if (!sourcePaper) {
      console.warn(`[GraphService] Paper ${paperId} not found`);
      return [];
    }

    // Extract keywords from the paper title for related search
    const title = sourcePaper.title || '';
    const keywords = title.split(' ').filter(word => word.length > 3).slice(0, 3).join(' ');
    
    if (!keywords) {
      console.warn(`[GraphService] No keywords extracted from paper ${paperId}`);
      return [];
    }

    try {
      // Use the API handler to search for related papers
      const relatedPapers = await this.apiHandler.makeQuery(keywords, {
        type: 'keyword',
        forceRefresh: false
      });

      // Filter out papers that already exist in the graph
      const existingIds = new Set(existingPapers.map(p => p.id));
      const newPapers = relatedPapers
        .filter(paper => !existingIds.has(paper.id))
        .slice(0, maxResults);

      // Add relationship metadata to indicate these are related to the source paper
      return newPapers.map(paper => ({
        ...paper,
        relatedTo: paperId, // Track which paper this is related to
        isRelated: true
      }));
    } catch (error) {
      console.error(`[GraphService] Error fetching related papers for ${paperId}:`, error);
      return [];
    }
  }

  /**
   * Fetch additional papers by the same author
   * @param {string} authorName - Author name from the original query
   * @param {Array} existingPapers - All papers currently displayed for the query
   * @param {number} maxResults - Maximum number of author papers to fetch
   */
  async fetchAdditionalAuthorPapers(authorName, existingPapers, maxResults = 5) {
    if (!authorName || !authorName.trim()) {
      return [];
    }

    try {
      const normalizedAuthor = authorName.trim().toLowerCase();
      const existingIds = new Set((existingPapers || []).map(p => p.id));

      const authorResults = await this.apiHandler.makeQuery(authorName, {
        type: 'author',
        forceRefresh: true,
        maxResultsOverride: Math.max(maxResults * 2, 10)
      });

      if (!authorResults || authorResults.length === 0) {
        return [];
      }

      const filtered = authorResults
        .filter(paper => paper && paper.id && !existingIds.has(paper.id))
        .map(paper => ({
          ...paper,
          // Track if this paper actually lists the author (best-effort)
          matchesAuthor: Array.isArray(paper.authors)
            ? paper.authors.some(author => (author || '').toLowerCase().includes(normalizedAuthor))
            : false
        }))
        .slice(0, maxResults);

      return filtered;
    } catch (error) {
      console.error(`[GraphService] Error fetching additional author papers for "${authorName}":`, error);
      return [];
    }
  }

  /**
   * Fetches the next layer of papers for all papers in the current layer
   * @param {Array} currentLayerPapers - Papers in the current layer
   * @param {Array} allExistingPapers - All papers currently in the graph
   * @param {number} maxPerPaper - Maximum related papers per source paper
   * @returns {Promise<Array>} Array of new papers for the next layer
   */
  async fetchNextLayer(currentLayerPapers, allExistingPapers, maxPerPaper = 3) {
    if (!currentLayerPapers || currentLayerPapers.length === 0) {
      return [];
    }

    const existingIds = new Set(allExistingPapers.map(p => p.id));
    const newPapers = [];
    const seenIds = new Set();

    // Fetch related papers for each paper in the current layer
    const fetchPromises = currentLayerPapers.map(async (paper) => {
      try {
        const related = await this.getRelatedPapers(paper.id, allExistingPapers, maxPerPaper);
        return related.filter(p => !seenIds.has(p.id) && !existingIds.has(p.id));
      } catch (error) {
        console.error(`[GraphService] Error fetching layer for paper ${paper.id}:`, error);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Flatten and deduplicate
    results.forEach(relatedPapers => {
      relatedPapers.forEach(paper => {
        if (!seenIds.has(paper.id)) {
          seenIds.add(paper.id);
          newPapers.push(paper);
        }
      });
    });

    return newPapers;
  }

  /**
   * Expands graph layer - main entry point
   * @param {Object} params - Expansion parameters
   * @param {Array} params.currentLayerPapers - Papers in current layer
   * @param {Array} params.allExistingPapers - All existing papers
   * @param {string} [params.authorName] - Optional author name for author-based expansion
   * @param {number} [params.maxPerPaper] - Max papers per source paper
   * @returns {Promise<Array>} New papers for the expanded layer
   */
  async expandLayer({ currentLayerPapers, allExistingPapers, authorName, maxPerPaper = 3 }) {
    try {
      let newPapers = [];

      // If author name provided, fetch author papers first
      if (authorName) {
        const authorPapers = await this.fetchAdditionalAuthorPapers(
          authorName,
          allExistingPapers,
          maxPerPaper
        );
        newPapers.push(...authorPapers);
      }

      // Then fetch related papers for current layer
      const relatedPapers = await this.fetchNextLayer(
        currentLayerPapers,
        allExistingPapers,
        maxPerPaper
      );
      newPapers.push(...relatedPapers);

      // Deduplicate
      const seenIds = new Set();
      return newPapers.filter(paper => {
        if (seenIds.has(paper.id)) return false;
        seenIds.add(paper.id);
        return true;
      });
    } catch (error) {
      console.error('[GraphService] Error expanding layer:', error);
      return [];
    }
  }
}


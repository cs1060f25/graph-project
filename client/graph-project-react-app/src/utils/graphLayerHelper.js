/**
 * Graph Layer Helper
 * 
 * Provides functions to fetch related papers for graph layer expansion.
 * This simulates fetching related papers based on paper relationships.
 * In a real implementation, this would call an API endpoint to get related papers.
 */

/**
 * Fetches related papers for a given paper ID
 * This is a simulated function that generates related papers based on the paper's title/keywords
 * 
 * @param {string} paperId - The ID of the paper to get related papers for
 * @param {Array} existingPapers - Array of all existing papers in the graph
 * @param {Object} apiHandler - API handler instance for making queries
 * @param {number} maxResults - Maximum number of related papers to return
 * @returns {Promise<Array>} Array of related paper objects
 */
export async function getRelatedPapers(paperId, existingPapers, apiHandler, maxResults = 5) {
  // Find the source paper
  const sourcePaper = existingPapers.find(p => p.id === paperId);
  if (!sourcePaper) {
    console.warn(`[GraphLayerHelper] Paper ${paperId} not found`);
    return [];
  }

  // Extract keywords from the paper title for related search
  const title = sourcePaper.title || '';
  const keywords = title.split(' ').filter(word => word.length > 3).slice(0, 3).join(' ');
  
  if (!keywords) {
    console.warn(`[GraphLayerHelper] No keywords extracted from paper ${paperId}`);
    return [];
  }

  try {
    // Use the API handler to search for related papers
    // This simulates finding papers that are related to the source paper
    const relatedPapers = await apiHandler.makeQuery(keywords, {
      type: 'keyword',
      userId: 'graph-expansion',
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
    console.error(`[GraphLayerHelper] Error fetching related papers for ${paperId}:`, error);
    return [];
  }
}

/**
 * Fetches the next layer of papers for all papers in the current layer
 * 
 * @param {Array} currentLayerPapers - Papers in the current layer
 * @param {Array} allExistingPapers - All papers currently in the graph
 * @param {Object} apiHandler - API handler instance
 * @param {number} maxPerPaper - Maximum related papers per source paper
 * @returns {Promise<Array>} Array of new papers for the next layer
 */
export async function fetchNextLayer(currentLayerPapers, allExistingPapers, apiHandler, maxPerPaper = 3) {
  if (!currentLayerPapers || currentLayerPapers.length === 0) {
    return [];
  }

  const existingIds = new Set(allExistingPapers.map(p => p.id));
  const newPapers = [];
  const seenIds = new Set();

  // Fetch related papers for each paper in the current layer
  const fetchPromises = currentLayerPapers.map(async (paper) => {
    try {
      const related = await getRelatedPapers(paper.id, allExistingPapers, apiHandler, maxPerPaper);
      return related.filter(p => !seenIds.has(p.id) && !existingIds.has(p.id));
    } catch (error) {
      console.error(`[GraphLayerHelper] Error fetching layer for paper ${paper.id}:`, error);
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
 * Creates relationship links between papers based on their relatedTo metadata
 * 
 * @param {Array} newPapers - New papers with relatedTo metadata
 * @param {Array} existingNodes - Existing graph nodes
 * @returns {Array} Array of link objects
 */
export function createLayerLinks(newPapers, existingNodes) {
  const links = [];
  const nodeIdSet = new Set(existingNodes.map(n => n.id));

  newPapers.forEach(paper => {
    if (paper.relatedTo && nodeIdSet.has(paper.relatedTo)) {
      links.push({
        source: paper.relatedTo,
        target: paper.id,
        value: 1,
        layer: paper.layer || 2 // Default to layer 2 for new connections
      });
    }
  });

  return links;
}


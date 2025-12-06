/**
 * Graph Layer Helper
 * 
 * Utility function for creating graph links between papers.
 * Note: Graph expansion logic has been moved to backend (server/services/graphService.js)
 */

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

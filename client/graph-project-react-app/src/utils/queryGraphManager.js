/**
 * Query Graph Manager
 * 
 * Utility functions for managing multiple query graphs, color assignment,
 * and merging queries with duplicate detection.
 */

// Color palette for query graphs (distinct, vibrant colors)
export const QUERY_COLOR_PALETTE = [
  '#3a82ff', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber/Orange
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#6366f1', // Indigo
  '#14b8a6', // Teal
];

/**
 * Creates a new query graph object
 * @param {string} queryText - The search query text
 * @param {Array} papers - Array of paper objects
 * @param {number} index - Index for color assignment
 * @returns {Object} Query graph object
 */
export function createQueryGraph(queryText, papers, index = 0, queryType = 'keyword') {
  const color = QUERY_COLOR_PALETTE[index % QUERY_COLOR_PALETTE.length];
  const id = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    label: queryText.length > 30 ? queryText.substring(0, 30) + '...' : queryText,
    fullLabel: queryText,
    color,
    visible: true,
    papers: papers || [],
    // Layer expansion state for this query
    layerPapers: { 1: papers || [] }, // Initialize with layer 1 papers
    currentDepth: 1, // Current layer depth for this query
    createdAt: new Date().toISOString(),
    queryType,
  };
}

/**
 * Merges multiple query graphs into a single graph data structure
 * Handles duplicate nodes by creating multi-query nodes
 * Supports layer expansion per query
 * @param {Array} queryGraphs - Array of query graph objects
 * @param {Function} transformPapersToGraph - Function to transform papers to graph format
 * @param {Function} createLayerLinks - Function to create links between layers
 * @returns {Object} Merged graph data with nodes and links
 */
export function mergeQueryGraphs(queryGraphs, transformPapersToGraph, createLayerLinks = null) {
  if (!queryGraphs || queryGraphs.length === 0) {
    return { nodes: [], links: [] };
  }

  // Filter to only visible queries
  const visibleQueries = queryGraphs.filter(qg => qg.visible);
  
  if (visibleQueries.length === 0) {
    return { nodes: [], links: [] };
  }

  // Track all nodes by ID to handle duplicates
  const nodeMap = new Map(); // id -> node
  const nodeQueryMap = new Map(); // id -> Set of query IDs
  const allLinks = [];

  // Process each query with its layer expansion
  visibleQueries.forEach(queryGraph => {
    const { id: queryId, layerPapers, currentDepth, color } = queryGraph;
    
    // Combine all papers from all visible layers for this query
    const allVisiblePapers = [];
    for (let layer = 1; layer <= (currentDepth || 1); layer++) {
      if (layerPapers && layerPapers[layer] && layerPapers[layer].length > 0) {
        allVisiblePapers.push(...layerPapers[layer]);
      }
    }
    
    if (allVisiblePapers.length === 0) return;

    // Transform papers to graph format for this query
    const graphData = transformPapersToGraph(allVisiblePapers, 1);
    
    // Process nodes
    graphData.nodes.forEach(node => {
      const nodeId = node.id;
      
      if (nodeMap.has(nodeId)) {
        // Node already exists - mark it as belonging to multiple queries
        const existingNode = nodeMap.get(nodeId);
        if (!nodeQueryMap.has(nodeId)) {
          nodeQueryMap.set(nodeId, new Set());
        }
        nodeQueryMap.get(nodeId).add(queryId);
        
        // Update node to show it belongs to multiple queries
        existingNode.queryIds = Array.from(nodeQueryMap.get(nodeId));
        existingNode.queryColors = existingNode.queryColors || [];
        if (!existingNode.queryColors.includes(color)) {
          existingNode.queryColors.push(color);
        }
      } else {
        // New node - add it
        const newNode = {
          ...node,
          queryId, // Primary query ID
          queryIds: [queryId],
          queryColors: [color],
          primaryColor: color, // Color for this query
        };
        nodeMap.set(nodeId, newNode);
        nodeQueryMap.set(nodeId, new Set([queryId]));
      }
    });

    // Process links from graph transformation
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      // Only add link if both nodes are in the visible graph
      if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
        allLinks.push({
          ...link,
          source: sourceId,
          target: targetId,
          queryId,
          color,
        });
      }
    });
    
    // Create links between layers for this query (if layer expansion exists)
    if (createLayerLinks && currentDepth > 1) {
      for (let layer = 2; layer <= currentDepth; layer++) {
        if (layerPapers && layerPapers[layer] && layerPapers[layer].length > 0) {
          const layerLinks = createLayerLinks(layerPapers[layer], Array.from(nodeMap.values()));
          layerLinks.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
              allLinks.push({
                ...link,
                source: sourceId,
                target: targetId,
                queryId,
                color,
                layer,
              });
            }
          });
        }
      }
    }
  });

  // Convert node map to array
  const nodes = Array.from(nodeMap.values());

  // Deduplicate links (same source-target pair from different queries)
  const linkMap = new Map();
  allLinks.forEach(link => {
    const key = `${link.source}-${link.target}`;
    if (!linkMap.has(key)) {
      linkMap.set(key, link);
    } else {
      // Link already exists - merge query info
      const existing = linkMap.get(key);
      if (!existing.queryIds) {
        existing.queryIds = [existing.queryId];
        existing.queryColors = [existing.color];
      }
      if (!existing.queryIds.includes(link.queryId)) {
        existing.queryIds.push(link.queryId);
        existing.queryColors.push(link.color);
      }
    }
  });

  const links = Array.from(linkMap.values());

  return { nodes, links };
}

/**
 * Toggles visibility of a query graph
 * @param {Array} queryGraphs - Current array of query graphs
 * @param {string} queryId - ID of query to toggle
 * @returns {Array} Updated array of query graphs
 */
export function toggleQueryVisibility(queryGraphs, queryId) {
  return queryGraphs.map(qg => 
    qg.id === queryId ? { ...qg, visible: !qg.visible } : qg
  );
}

/**
 * Removes a query graph from the list
 * @param {Array} queryGraphs - Current array of query graphs
 * @param {string} queryId - ID of query to remove
 * @returns {Array} Updated array of query graphs
 */
export function removeQueryGraph(queryGraphs, queryId) {
  return queryGraphs.filter(qg => qg.id !== queryId);
}

/**
 * Gets the next available color from the palette
 * @param {Array} queryGraphs - Current array of query graphs
 * @returns {string} Color hex code
 */
export function getNextColor(queryGraphs) {
  const usedColors = new Set(queryGraphs.map(qg => qg.color));
  const availableColor = QUERY_COLOR_PALETTE.find(color => !usedColors.has(color));
  return availableColor || QUERY_COLOR_PALETTE[queryGraphs.length % QUERY_COLOR_PALETTE.length];
}


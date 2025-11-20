/**
 * Transforms API response data into graph format (nodes and edges)
 * for visualization libraries like react-force-graph
 * 
 * @param {Array} papers - Array of paper objects from API
 * @param {number} layer - Layer number (1 = seed, 2 = first expansion, 3 = second expansion)
 * @returns {Object} Graph data with nodes and links
 */
export const transformPapersToGraph = (papers, layer = 1) => {
  if (!papers || !Array.isArray(papers) || papers.length === 0) {
    return { nodes: [], links: [] };
  }

  // Create nodes from papers
  const nodes = papers.map((paper, index) => {
    // Handle both API response format and direct format
    const year = paper.year || (paper.published ? new Date(paper.published).getFullYear() : null);
    const url = paper.url || paper.link || null;
    // GRAPH-85: Preserve citationCount even if it's 0 (don't default to 0 if undefined)
    const citationCount = paper.citationCount !== undefined && paper.citationCount !== null 
      ? paper.citationCount 
      : 0;
    
    return {
      id: paper.id || `paper-${index}`,
      title: paper.title || 'Untitled',
      authors: paper.authors || [],
      year: year,
      citations: citationCount, // Always use actual citationCount, even if 0
      citationCount: citationCount, // Also preserve as citationCount for compatibility
      url: url,
      // Visual properties
      group: paper.category || 1,
      value: citationCount > 0 ? citationCount : 1, // Node size: use citationCount if > 0, else 1 for visibility
      // Layer information for visual distinction
      layer: paper.layer || layer, // Track which layer this node belongs to
    };
  });

  // Create links (edges) based on citations/references
  const links = [];
  const paperIdMap = new Map(nodes.map((node, i) => [node.id, i]));

  // Debug: log paper with most citations
  const paperWithMostCitations = papers.reduce((max, p) => 
    (p.citationCount || 0) > (max.citationCount || 0) ? p : max, papers[0] || {});
  if (paperWithMostCitations.citationCount > 100) {
    console.log(`[GraphTransformer] Paper with ${paperWithMostCitations.citationCount} citations:`, {
      id: paperWithMostCitations.id,
      title: paperWithMostCitations.title?.substring(0, 50),
      citedByCount: paperWithMostCitations.citedBy?.length || 0,
      citedBySample: paperWithMostCitations.citedBy?.slice(0, 3),
      nodeInMap: paperIdMap.has(paperWithMostCitations.id),
    });
  }

  papers.forEach((paper, index) => {
    const sourceId = paper.id || `paper-${index}`;
    
    // If paper has references/citations, create links
    // References are papers this paper cites (outgoing edges)
    if (paper.references && Array.isArray(paper.references)) {
      paper.references.forEach(refId => {
        // Normalize refId to match node IDs (handle OpenAlex format)
        const normalizedRefId = refId;
        if (paperIdMap.has(normalizedRefId)) {
          links.push({
            source: sourceId,
            target: normalizedRefId,
            value: 1, // Link strength
            layer: paper.layer || layer,
          });
        }
      });
    }
    
    // If paper has citedBy information, create reverse links
    // CitedBy are papers that cite this paper (incoming edges)
    if (paper.citedBy && Array.isArray(paper.citedBy)) {
      let edgesCreated = 0;
      paper.citedBy.forEach(citingId => {
        const normalizedCitingId = citingId;
        if (paperIdMap.has(normalizedCitingId)) {
          links.push({
            source: normalizedCitingId,
            target: sourceId,
            value: 1,
            layer: paper.layer || layer,
          });
          edgesCreated++;
        }
      });
      
      // Debug: log if paper has many citations but few edges
      if (paper.citationCount > 100 && edgesCreated < paper.citedBy.length * 0.1) {
        console.warn(`[GraphTransformer] Paper ${paper.id} has ${paper.citationCount} citations, ` +
          `${paper.citedBy.length} in citedBy array, but only ${edgesCreated} edges created. ` +
          `Node in map: ${paperIdMap.has(sourceId)}`);
      }
    }
  });

  // If no links exist, create a simple connected graph
  if (links.length === 0 && nodes.length > 1) {
    // Create a simple chain or star graph
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
        value: 1,
      });
    }
  }

  return { nodes, links };
};

/**
 * Creates mock graph data for testing
 * @returns {Object} Mock graph data
 */
export const createMockGraphData = () => {
  const mockPapers = [
    {
      id: 'paper-1',
      title: 'Graph Neural Networks for Research Discovery',
      authors: ['Author A', 'Author B'],
      year: 2023,
      citationCount: 45,
      category: 'AI',
    },
    {
      id: 'paper-2',
      title: 'Semantic Search in Academic Papers',
      authors: ['Author C', 'Author D'],
      year: 2024,
      citationCount: 23,
      category: 'NLP',
      references: ['paper-1'],
    },
    {
      id: 'paper-3',
      title: 'Citation Network Analysis',
      authors: ['Author E'],
      year: 2022,
      citationCount: 67,
      category: 'Graph Theory',
      references: ['paper-1'],
    },
    {
      id: 'paper-4',
      title: 'Knowledge Graph Construction',
      authors: ['Author F', 'Author G'],
      year: 2024,
      citationCount: 12,
      category: 'Data Science',
      references: ['paper-2', 'paper-3'],
    },
  ];

  return transformPapersToGraph(mockPapers);
};


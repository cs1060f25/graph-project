/**
 * Transforms API response data into graph format (nodes and edges)
 * for visualization libraries like react-force-graph
 * 
 * @param {Array} papers - Array of paper objects from API
 * @returns {Object} Graph data with nodes and links
 */
export const transformPapersToGraph = (papers) => {
  if (!papers || !Array.isArray(papers) || papers.length === 0) {
    return { nodes: [], links: [] };
  }

  // Create nodes from papers
  const nodes = papers.map((paper, index) => {
    // Handle both API response format and direct format
    const year = paper.year || (paper.published ? new Date(paper.published).getFullYear() : null);
    const url = paper.url || paper.link || null;
    const citationCount = paper.citationCount || 0;
    
    return {
      id: paper.id || `paper-${index}`,
      title: paper.title || 'Untitled',
      authors: paper.authors || [],
      year: year,
      citations: citationCount,
      url: url,
      // Visual properties
      group: paper.category || 1,
      value: citationCount || 1, // Node size based on citations
    };
  });

  // Create links (edges) based on citations/references
  const links = [];
  const paperIdMap = new Map(nodes.map((node, i) => [node.id, i]));

  papers.forEach((paper, index) => {
    const sourceId = paper.id || `paper-${index}`;
    
    // If paper has references/citations, create links
    if (paper.references && Array.isArray(paper.references)) {
      paper.references.forEach(refId => {
        if (paperIdMap.has(refId)) {
          links.push({
            source: sourceId,
            target: refId,
            value: 1, // Link strength
          });
        }
      });
    }
    
    // If paper has citedBy information, create reverse links
    if (paper.citedBy && Array.isArray(paper.citedBy)) {
      paper.citedBy.forEach(citingId => {
        if (paperIdMap.has(citingId)) {
          links.push({
            source: citingId,
            target: sourceId,
            value: 1,
          });
        }
      });
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


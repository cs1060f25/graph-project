/**
 * Unit tests for graphDataTransformer
 * Tests that API response data is correctly transformed to graph format
 */

import { transformPapersToGraph, createMockGraphData } from './graphDataTransformer';

describe('transformPapersToGraph', () => {
  test('should return empty graph for empty input', () => {
    const result = transformPapersToGraph([]);
    expect(result).toEqual({ nodes: [], links: [] });
  });

  test('should return empty graph for null input', () => {
    const result = transformPapersToGraph(null);
    expect(result).toEqual({ nodes: [], links: [] });
  });

  test('should transform API response format to graph nodes', () => {
    const papers = [
      {
        id: 'paper-1',
        title: 'Test Paper 1',
        authors: ['Author One', 'Author Two'],
        published: '2023-06-15T00:00:00Z',
        link: 'https://example.com/paper1',
      },
      {
        id: 'paper-2',
        title: 'Test Paper 2',
        authors: ['Author Three'],
        year: 2024,
        url: 'https://example.com/paper2',
        citationCount: 10,
      },
    ];

    const result = transformPapersToGraph(papers);
    
    expect(result.nodes).toHaveLength(2);
    expect(result.nodes[0].id).toBe('paper-1');
    expect(result.nodes[0].title).toBe('Test Paper 1');
    expect(result.nodes[0].authors).toEqual(['Author One', 'Author Two']);
    // Year should be extracted from published date (check it's a number close to 2023)
    expect(result.nodes[0].year).toBeGreaterThanOrEqual(2022);
    expect(result.nodes[0].year).toBeLessThanOrEqual(2024);
    expect(result.nodes[0].url).toBe('https://example.com/paper1');
    
    expect(result.nodes[1].id).toBe('paper-2');
    expect(result.nodes[1].year).toBe(2024);
    expect(result.nodes[1].url).toBe('https://example.com/paper2');
    expect(result.nodes[1].citations).toBe(10);
  });

  test('should create links from references', () => {
    const papers = [
      {
        id: 'paper-1',
        title: 'Paper 1',
        authors: ['Author A'],
      },
      {
        id: 'paper-2',
        title: 'Paper 2',
        authors: ['Author B'],
        references: ['paper-1'],
      },
    ];

    const result = transformPapersToGraph(papers);
    
    expect(result.links).toHaveLength(1);
    expect(result.links[0].source).toBe('paper-2');
    expect(result.links[0].target).toBe('paper-1');
  });

  test('should create links from citedBy', () => {
    const papers = [
      {
        id: 'paper-1',
        title: 'Paper 1',
        authors: ['Author A'],
        citedBy: ['paper-2'],
      },
      {
        id: 'paper-2',
        title: 'Paper 2',
        authors: ['Author B'],
      },
    ];

    const result = transformPapersToGraph(papers);
    
    expect(result.links).toHaveLength(1);
    expect(result.links[0].source).toBe('paper-2');
    expect(result.links[0].target).toBe('paper-1');
  });

  test('should create simple chain graph when no links exist', () => {
    const papers = [
      { id: 'paper-1', title: 'Paper 1', authors: ['Author A'] },
      { id: 'paper-2', title: 'Paper 2', authors: ['Author B'] },
      { id: 'paper-3', title: 'Paper 3', authors: ['Author C'] },
    ];

    const result = transformPapersToGraph(papers);
    
    expect(result.nodes).toHaveLength(3);
    expect(result.links.length).toBeGreaterThan(0); // Should create chain links
  });

  test('should handle missing optional fields', () => {
    const papers = [
      {
        id: 'paper-1',
        title: 'Paper 1',
        // Missing authors, year, etc.
      },
    ];

    const result = transformPapersToGraph(papers);
    
    expect(result.nodes[0].authors).toEqual([]);
    expect(result.nodes[0].year).toBeNull();
    expect(result.nodes[0].citations).toBe(0);
    expect(result.nodes[0].url).toBeNull();
  });

  // GRAPH-85: Test citation count preservation (including 0 values)
  test('GRAPH-85: should preserve citation count of 0', () => {
    const papers = [
      {
        id: 'paper-1',
        title: 'Paper 1',
        authors: ['Author A'],
        citationCount: 0, // Explicitly 0, not undefined
      },
      {
        id: 'paper-2',
        title: 'Paper 2',
        authors: ['Author B'],
        citationCount: 45,
      },
    ];

    const result = transformPapersToGraph(papers);
    
    expect(result.nodes[0].citations).toBe(0);
    expect(result.nodes[0].citationCount).toBe(0);
    expect(result.nodes[1].citations).toBe(45);
    expect(result.nodes[1].citationCount).toBe(45);
  });

  // GRAPH-85: Test ID normalization with OpenAlex URLs
  test('GRAPH-85: should normalize OpenAlex IDs correctly', () => {
    const papers = [
      {
        id: 'https://openalex.org/W123456789',
        title: 'Paper 1',
        authors: ['Author A'],
        citationCount: 10,
        citedBy: ['https://openalex.org/W987654321'],
      },
      {
        id: 'https://openalex.org/W987654321',
        title: 'Paper 2',
        authors: ['Author B'],
        citationCount: 5,
      },
    ];

    const result = transformPapersToGraph(papers);
    
    // Nodes should have normalized IDs
    expect(result.nodes[0].id).toBe('https://openalex.org/W123456789');
    expect(result.nodes[1].id).toBe('https://openalex.org/W987654321');
    
    // Links should be created with normalized IDs
    expect(result.links.length).toBeGreaterThan(0);
    const citingLink = result.links.find(link => 
      (typeof link.source === 'string' ? link.source : link.source.id) === 'https://openalex.org/W987654321' &&
      (typeof link.target === 'string' ? link.target : link.target.id) === 'https://openalex.org/W123456789'
    );
    expect(citingLink).toBeDefined();
  });

  // GRAPH-85: Test citation-based edge creation with multiple citing papers
  test('GRAPH-85: should create edges from multiple citing papers', () => {
    const papers = [
      {
        id: 'paper-1',
        title: 'Paper 1',
        authors: ['Author A'],
        citationCount: 3,
        citedBy: ['paper-2', 'paper-3', 'paper-4'],
      },
      {
        id: 'paper-2',
        title: 'Paper 2',
        authors: ['Author B'],
      },
      {
        id: 'paper-3',
        title: 'Paper 3',
        authors: ['Author C'],
      },
      {
        id: 'paper-4',
        title: 'Paper 4',
        authors: ['Author D'],
      },
    ];

    const result = transformPapersToGraph(papers);
    
    // Should create 3 edges (one from each citing paper to paper-1)
    const edgesToPaper1 = result.links.filter(link => {
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return targetId === 'paper-1';
    });
    expect(edgesToPaper1.length).toBe(3);
    
    // Each citing paper should have an edge to paper-1
    expect(edgesToPaper1.some(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      return sourceId === 'paper-2';
    })).toBe(true);
    expect(edgesToPaper1.some(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      return sourceId === 'paper-3';
    })).toBe(true);
    expect(edgesToPaper1.some(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      return sourceId === 'paper-4';
    })).toBe(true);
  });

  // GRAPH-85: Test that edges are only created when both papers exist
  test('GRAPH-85: should not create edges to non-existent papers', () => {
    const papers = [
      {
        id: 'paper-1',
        title: 'Paper 1',
        authors: ['Author A'],
        citationCount: 2,
        citedBy: ['paper-2', 'paper-nonexistent'], // paper-nonexistent doesn't exist
        references: ['paper-3', 'paper-also-nonexistent'], // paper-also-nonexistent doesn't exist
      },
      {
        id: 'paper-2',
        title: 'Paper 2',
        authors: ['Author B'],
      },
      {
        id: 'paper-3',
        title: 'Paper 3',
        authors: ['Author C'],
      },
    ];

    const result = transformPapersToGraph(papers);
    
    // Should only create edges to papers that exist (paper-2 and paper-3)
    expect(result.links.length).toBe(2);
    
    // Edge from paper-2 to paper-1 (citedBy)
    expect(result.links.some(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return sourceId === 'paper-2' && targetId === 'paper-1';
    })).toBe(true);
    
    // Edge from paper-1 to paper-3 (references)
    expect(result.links.some(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return sourceId === 'paper-1' && targetId === 'paper-3';
    })).toBe(true);
  });
});

describe('createMockGraphData', () => {
  test('should create mock graph data with nodes and links', () => {
    const result = createMockGraphData();
    
    expect(result).toHaveProperty('nodes');
    expect(result).toHaveProperty('links');
    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.links.length).toBeGreaterThan(0);
  });

  test('should create valid graph structure', () => {
    const result = createMockGraphData();
    
    // All nodes should have required properties
    result.nodes.forEach(node => {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('title');
      expect(node).toHaveProperty('authors');
    });
    
    // All links should have source and target
    result.links.forEach(link => {
      expect(link).toHaveProperty('source');
      expect(link).toHaveProperty('target');
    });
  });
});


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


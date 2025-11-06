import { papersToGraph } from './transformToGraph';

describe('papersToGraph', () => {
  test('converts paper list into nodes and links by shared authors', () => {
    const papers = [
      { id: 'p1', title: 'One', authors: ['Alice', 'Bob'] },
      { id: 'p2', title: 'Two', authors: ['Bob', 'Carol'] },
      { id: 'p3', title: 'Three', authors: ['Dave'] },
    ];

    const graph = papersToGraph(papers);
    // Nodes reflect all papers
    expect(graph.nodes.map((n) => n.id)).toEqual(['p1', 'p2', 'p3']);
    // Bob connects p1-p2 (shared author creates link)
    expect(graph.links.length).toBeGreaterThanOrEqual(1);
    expect(graph.links).toContainEqual({ source: 'p1', target: 'p2' });
  });

  test('creates mesh connections when papers have no shared authors', () => {
    const papers = [
      { id: 'p1', title: 'One', authors: ['Alice'] },
      { id: 'p2', title: 'Two', authors: ['Bob'] },
      { id: 'p3', title: 'Three', authors: ['Carol'] },
      { id: 'p4', title: 'Four', authors: ['Dave'] },
    ];

    const graph = papersToGraph(papers);
    expect(graph.nodes.length).toBe(4);
    // Should create multiple links for a mesh structure (not just a chain)
    expect(graph.links.length).toBeGreaterThanOrEqual(3);
    
    // Verify it's not just a simple chain - at least one node should have 2+ connections
    const connectionCounts = new Map();
    for (const link of graph.links) {
      connectionCounts.set(link.source, (connectionCounts.get(link.source) || 0) + 1);
      connectionCounts.set(link.target, (connectionCounts.get(link.target) || 0) + 1);
    }
    const maxConnections = Math.max(...connectionCounts.values());
    expect(maxConnections).toBeGreaterThanOrEqual(2);
  });

  test('handles empty input gracefully', () => {
    expect(papersToGraph([])).toEqual({ nodes: [], links: [] });
  });
});

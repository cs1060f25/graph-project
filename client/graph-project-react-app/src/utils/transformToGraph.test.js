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
    // Bob connects p1-p2 (sequential linking strategy)
    expect(graph.links).toEqual([{ source: 'p1', target: 'p2' }]);
  });

  test('handles empty input gracefully', () => {
    expect(papersToGraph([])).toEqual({ nodes: [], links: [] });
  });
});

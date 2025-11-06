/**
 * Convert a list of paper objects into graph data (nodes/links).
 * Paper shape: { id, title, authors: string[] }
 * Strategy:
 *  - Create a node per paper (id, label=title)
 *  - Create links between papers that share at least one author
 *    (simple heuristic to visualize relationships when citation data is absent)
 */
export function papersToGraph(papers = []) {
  const nodes = [];
  const links = [];

  const authorToPapers = new Map();

  for (const p of papers) {
    const id = String(p.id ?? p.link ?? p.title);
    nodes.push({ id, label: p.title || id });

    const authors = Array.isArray(p.authors) ? p.authors : [];
    for (const a of authors) {
      if (!authorToPapers.has(a)) authorToPapers.set(a, []);
      authorToPapers.get(a).push(id);
    }
  }

  // Build links for shared authors (avoid dense cliques by limiting edges per author)
  for (const [, paperIds] of authorToPapers) {
    if (paperIds.length < 2) continue;
    // Link sequentially to reduce density: p0-p1, p1-p2, ...
    for (let i = 0; i < paperIds.length - 1; i++) {
      const source = paperIds[i];
      const target = paperIds[i + 1];
      links.push({ source, target });
    }
  }

  return { nodes, links };
}

// Basic mock data for quick visual checks
export const mockGraph = {
  nodes: [
    { id: 'p1', label: 'Paper One' },
    { id: 'p2', label: 'Paper Two' },
    { id: 'p3', label: 'Paper Three' },
  ],
  links: [
    { source: 'p1', target: 'p2' },
    { source: 'p2', target: 'p3' },
  ],
};

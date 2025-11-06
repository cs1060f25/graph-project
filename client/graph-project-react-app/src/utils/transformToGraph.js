/**
 * Convert a list of paper objects into graph data (nodes/links).
 * Paper shape: { id, title, authors: string[], summary, published, link }
 * Strategy:
 *  - Create a node per paper (id, label=title, preserve all paper data)
 *  - Create links between papers that share at least one author (mesh connections)
 *  - If no shared authors, create multiple links based on similarity heuristics
 */
export function papersToGraph(papers = []) {
  const nodes = [];
  const links = [];
  const linkSet = new Set(); // Track unique links to avoid duplicates

  const authorToPapers = new Map();

  for (const p of papers) {
    const id = String(p.id ?? p.link ?? p.title);
    // Preserve all paper data for detail panel
    nodes.push({ 
      id, 
      label: p.title || id,
      authors: p.authors,
      summary: p.summary,
      published: p.published,
      link: p.link,
    });

    const authors = Array.isArray(p.authors) ? p.authors : [];
    for (const a of authors) {
      if (a && a.trim()) { // Only add non-empty authors
        if (!authorToPapers.has(a)) authorToPapers.set(a, []);
        authorToPapers.get(a).push(id);
      }
    }
  }

  // Helper to add unique link with connection strength
  const addLink = (source, target, strength = 1) => {
    const key1 = `${source}-${target}`;
    const key2 = `${target}-${source}`;
    if (!linkSet.has(key1) && !linkSet.has(key2)) {
      links.push({ source, target, strength });
      linkSet.add(key1);
      return true;
    } else {
      // If link already exists, strengthen it
      const existing = links.find(l => 
        (l.source === source && l.target === target) || 
        (l.source === target && l.target === source)
      );
      if (existing) {
        existing.strength = (existing.strength || 1) + strength;
      }
      return false;
    }
  };

  // Build links for shared authors - create mesh within each author group
  const linkedPapers = new Set();
  for (const [, paperIds] of authorToPapers) {
    if (paperIds.length < 2) continue;
    
    // Create mesh connections within papers sharing this author
    // Strength increases with multiple shared authors
    // For small groups (2-4 papers), connect all pairs
    // For larger groups, connect each to 1-2 others to vary connections
    if (paperIds.length <= 4) {
      for (let i = 0; i < paperIds.length; i++) {
        for (let j = i + 1; j < paperIds.length; j++) {
          addLink(paperIds[i], paperIds[j], 1);
          linkedPapers.add(paperIds[i]);
          linkedPapers.add(paperIds[j]);
        }
      }
    } else {
      // For larger groups, connect each paper to 1-2 others (not 3)
      for (let i = 0; i < paperIds.length; i++) {
        const connections = Math.min(2, paperIds.length - 1);
        for (let c = 1; c <= connections; c++) {
          const targetIdx = (i + c) % paperIds.length;
          addLink(paperIds[i], paperIds[targetIdx], 1);
          linkedPapers.add(paperIds[i]);
          linkedPapers.add(paperIds[targetIdx]);
        }
      }
    }
  }

  // Create additional connections for unlinked or poorly-connected papers
  if (nodes.length > 1) {
    // Find papers with few or no connections
    const connectionCount = new Map();
    for (const node of nodes) {
      connectionCount.set(node.id, 0);
    }
    for (const link of links) {
      connectionCount.set(link.source, (connectionCount.get(link.source) || 0) + 1);
      connectionCount.set(link.target, (connectionCount.get(link.target) || 0) + 1);
    }

    // Connect papers with 0-1 connections to 1-2 nearby papers (weaker connections)
    const weaklyConnected = nodes.filter(n => (connectionCount.get(n.id) || 0) <= 1);
    const wellConnected = nodes.filter(n => (connectionCount.get(n.id) || 0) > 1);
    
    if (weaklyConnected.length > 0) {
      for (let i = 0; i < weaklyConnected.length; i++) {
        const current = weaklyConnected[i];
        
        // Connect to 1-2 well-connected papers if available (with lower strength)
        if (wellConnected.length > 0) {
          const connectTo = Math.min(1 + (i % 2), wellConnected.length); // Varies between 1-2
          for (let j = 0; j < connectTo; j++) {
            const target = wellConnected[j % wellConnected.length];
            addLink(current.id, target.id, 0.5); // Weaker fallback connections
          }
        } else {
          // If no well-connected papers, connect to next 1-2 in weakly connected
          const connectTo = 1 + (i % 2); // Varies between 1-2
          for (let offset = 1; offset <= connectTo; offset++) {
            const nextIdx = (i + offset) % weaklyConnected.length;
            if (nextIdx !== i) {
              addLink(current.id, weaklyConnected[nextIdx].id, 0.5);
            }
          }
        }
      }
    }

    // If still no links, create a basic chain with some cross-links
    if (links.length === 0) {
      for (let i = 0; i < nodes.length; i++) {
        // Connect to next 1-2 nodes
        const connectTo = 1 + (i % 2); // Varies between 1-2
        for (let j = i + 1; j < Math.min(i + 1 + connectTo, nodes.length); j++) {
          addLink(nodes[i].id, nodes[j].id, 0.3);
        }
      }
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

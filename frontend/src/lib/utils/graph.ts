// Temporary graph transformation utilities
// TODO: Move to backend graph service once implemented

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  link?: string;
  url?: string;
  summary?: string;
  abstract?: string;
  published?: string;
  year?: number;
  citations?: number;
  citationCount?: number;
  layer?: number;
  references?: string[];
  citedBy?: string[];
}

export interface Node {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  citations?: number;
  url?: string;
  layer?: number;
  queryIds?: string[];
  queryColors?: string[];
  primaryColor?: string;
}

export interface Link {
  source: string | Node;
  target: string | Node;
  value: number;
  layer?: number;
  queryId?: string;
  color?: string;
  queryColors?: string[];
}

export interface GraphData {
  nodes: Node[];
  links: Link[];
}

export function transformPaperToNode(paper: Paper, layer: number = 1): Node {
  const year = paper.year || (paper.published ? new Date(paper.published).getFullYear() : null);
  const url = paper.url || paper.link || null;
  const citationCount = paper.citations || paper.citationCount || 0;
  
  return {
    id: paper.id || `paper-${Date.now()}`,
    title: paper.title || 'Untitled',
    authors: paper.authors || [],
    year: year || undefined,
    citations: citationCount || undefined,
    url: url || undefined,
    layer: paper.layer || layer,
  };
}

export function createLinksBetweenPapers(papers: Paper[]): Link[] {
  const links: Link[] = [];
  const paperIdMap = new Map(papers.map((paper, i) => [paper.id || `paper-${i}`, i]));

  papers.forEach((paper, index) => {
    const sourceId = paper.id || `paper-${index}`;
    
    if (paper.references && Array.isArray(paper.references)) {
      paper.references.forEach(refId => {
        if (paperIdMap.has(refId)) {
          links.push({
            source: sourceId,
            target: refId,
            value: 1,
          });
        }
      });
    }
    
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

  return links;
}

export function buildGraphData(nodes: Node[], links: Link[]): GraphData {
  return { nodes, links };
}

export function transformPapersToGraph(papers: Paper[], layer: number = 1): GraphData {
  if (!papers || !Array.isArray(papers) || papers.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodes = papers.map((paper, index) => transformPaperToNode(paper, layer));
  const links = createLinksBetweenPapers(papers);

  // If no links exist, create a simple connected graph
  if (links.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        source: nodes[i].id,
        target: nodes[i + 1].id,
        value: 1,
      });
    }
  }

  return buildGraphData(nodes, links);
}

export function deduplicateLinks(links: Link[]): Link[] {
  const uniqueLinks: Link[] = [];
  const linkSet = new Set<string>();
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkKey = `${sourceId}-${targetId}`;
    if (!linkSet.has(linkKey)) {
      linkSet.add(linkKey);
      uniqueLinks.push(link);
    }
  });
  
  return uniqueLinks;
}


interface Paper {
  id?: string;
  paperId?: string;
  doi?: string;
  title?: string;
  authors?: string[] | string;
  year?: number;
  published?: string;
  publishedDate?: string;
  url?: string;
  link?: string;
  citationCount?: number;
  citedBy?: string[];
  references?: string[];
  category?: string | number;
  layer?: number;
}

export interface GraphNode {
  id: string;
  title: string;
  authors: string[];
  year: number | null;
  citations: number;
  citationCount: number;
  url: string | null;
  group: string | number;
  value: number;
  layer: number;
  queryId?: string;
  queryIds?: string[];
  queryColors?: string[];
  primaryColor?: string;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  layer?: number;
  queryId?: string;
  queryIds?: string[];
  queryColors?: string[];
  color?: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

function normalizePaperId(paperOrId: Paper | string | null): string | null {
  if (!paperOrId) return null;
  if (typeof paperOrId === 'string') return paperOrId.trim();
  if (typeof paperOrId === 'object') {
    if (paperOrId.paperId) return String(paperOrId.paperId);
    if (paperOrId.id) return String(paperOrId.id);
    if (paperOrId.doi) {
      const doi = paperOrId.doi.trim().toLowerCase();
      return doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '');
    }
  }
  return String(paperOrId);
}

export const transformPapersToGraph = (papers: Paper[], layer: number = 1): GraphData => {
  if (!papers || !Array.isArray(papers) || papers.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodes: GraphNode[] = papers.map((paper, index) => {
    const year = paper.year || (paper.published ? new Date(paper.published).getFullYear() : null);
    const url = paper.url || paper.link || null;
    const citationCount = paper.citationCount !== undefined && paper.citationCount !== null 
      ? paper.citationCount 
      : 0;
    const normalizedId = normalizePaperId(paper) || `paper-${index}`;
    const authors = Array.isArray(paper.authors) 
      ? paper.authors 
      : (paper.authors ? [paper.authors] : []);
    
    return {
      id: normalizedId,
      title: paper.title || 'Untitled',
      authors: authors,
      year: year,
      citations: citationCount,
      citationCount: citationCount,
      url: url,
      group: paper.category || 1,
      value: citationCount > 0 ? citationCount : 1,
      layer: paper.layer || layer,
    };
  });

  const links: GraphLink[] = [];
  const paperIdMap = new Map(nodes.map((node, i) => [node.id, i]));

  papers.forEach((paper, index) => {
    const sourceId = normalizePaperId(paper) || `paper-${index}`;
    
    if (paper.references && Array.isArray(paper.references)) {
      paper.references.forEach(refId => {
        const normalizedRefId = normalizePaperId(refId as any);
        if (normalizedRefId && paperIdMap.has(normalizedRefId)) {
          links.push({
            source: sourceId,
            target: normalizedRefId,
            value: 1,
            layer: paper.layer || layer,
          });
        }
      });
    }
    
    if (paper.citedBy && Array.isArray(paper.citedBy)) {
      paper.citedBy.forEach(citingId => {
        const normalizedCitingId = normalizePaperId(citingId as any);
        if (normalizedCitingId && paperIdMap.has(normalizedCitingId)) {
          links.push({
            source: normalizedCitingId,
            target: sourceId,
            value: 1,
            layer: paper.layer || layer,
          });
        }
      });
    }
  });

  if (links.length === 0 && nodes.length > 1) {
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

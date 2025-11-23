import { Paper } from '../models/types';

interface PaperWithRelations extends Paper {
  relatedTo?: string;
  isRelated?: boolean;
}

interface Link {
  source: string | { id: string };
  target: string | { id: string };
  value: number;
  layer?: number;
}

interface GraphNode {
  id: string;
  [key: string]: any;
}

type SearchFunction = (query: string, options: { type: 'keyword' | 'topic', userId?: string, forceRefresh?: boolean }) => Promise<Paper[]>;

async function getRelatedPapers(
  paperId: string, 
  existingPapers: Paper[], 
  searchFn: SearchFunction, 
  maxResults: number = 5
): Promise<PaperWithRelations[]> {
  const sourcePaper = existingPapers.find(p => p.id === paperId);
  if (!sourcePaper) return [];

  const title = sourcePaper.title || '';
  const keywords = title.split(' ').filter(word => word.length > 3).slice(0, 3).join(' ');
  
  if (!keywords) return [];

  try {
    const relatedPapers = await searchFn(keywords, {
      type: 'keyword',
      userId: 'graph-expansion',
      forceRefresh: false
    });

    const existingIds = new Set(existingPapers.map(p => p.id));
    const newPapers = relatedPapers
      .filter(paper => !existingIds.has(paper.id))
      .slice(0, maxResults);

    return newPapers.map(paper => ({
      ...paper,
      relatedTo: paperId,
      isRelated: true
    }));
  } catch (error) {
    console.error(`[GraphLayerHelper] Error fetching related papers for ${paperId}:`, error);
    return [];
  }
}

export async function fetchNextLayer(
  currentLayerPapers: Paper[], 
  allExistingPapers: Paper[], 
  searchFn: SearchFunction, 
  maxPerPaper: number = 3
): Promise<Paper[]> {
  if (!currentLayerPapers || currentLayerPapers.length === 0) return [];

  const existingIds = new Set(allExistingPapers.map(p => p.id));
  const newPapers: Paper[] = [];
  const seenIds = new Set<string>();

  const fetchPromises = currentLayerPapers.map(async (paper) => {
    try {
      const related = await getRelatedPapers(paper.id, allExistingPapers, searchFn, maxPerPaper);
      return related.filter(p => !seenIds.has(p.id) && !existingIds.has(p.id));
    } catch (error) {
      console.error(`[GraphLayerHelper] Error fetching layer for paper ${paper.id}:`, error);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  
  results.forEach(relatedPapers => {
    relatedPapers.forEach(paper => {
      if (!seenIds.has(paper.id)) {
        seenIds.add(paper.id);
        newPapers.push(paper);
      }
    });
  });

  return newPapers;
}

export function createLayerLinks(newPapers: PaperWithRelations[], existingNodes: GraphNode[]): Link[] {
  const links: Link[] = [];
  const nodeIdSet = new Set(existingNodes.map(n => n.id));

  newPapers.forEach(paper => {
    if (paper.relatedTo && nodeIdSet.has(paper.relatedTo)) {
      links.push({
        source: paper.relatedTo,
        target: paper.id,
        value: 1,
        layer: 2,
      });
    }
  });

  return links;
}

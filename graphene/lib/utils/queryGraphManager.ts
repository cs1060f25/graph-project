import { GraphNode, GraphLink } from './graphDataTransformer';

export const QUERY_COLOR_PALETTE: string[] = [
  '#3a82ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6',
];

interface Paper {
  id: string;
  [key: string]: any;
}

interface QueryGraph {
  id: string;
  label: string;
  fullLabel: string;
  color: string;
  visible: boolean;
  papers: Paper[];
  layerPapers: { [key: number]: Paper[] };
  currentDepth: number;
  createdAt: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

type TransformFunction = (papers: Paper[], layer?: number) => GraphData;
type CreateLayerLinksFunction = (newPapers: Paper[], existingNodes: GraphNode[]) => GraphLink[];

export function createQueryGraph(queryText: string, papers: Paper[], index: number = 0): QueryGraph {
  const color = QUERY_COLOR_PALETTE[index % QUERY_COLOR_PALETTE.length];
  const id = `query-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  return {
    id,
    label: queryText.length > 30 ? queryText.substring(0, 30) + '...' : queryText,
    fullLabel: queryText,
    color,
    visible: true,
    papers: papers || [],
    layerPapers: { 1: papers || [] },
    currentDepth: 1,
    createdAt: new Date().toISOString(),
  };
}

export function mergeQueryGraphs(
  queryGraphs: QueryGraph[], 
  transformPapersToGraph: TransformFunction, 
  createLayerLinks: CreateLayerLinksFunction | null = null
): GraphData {
  if (!queryGraphs || queryGraphs.length === 0) return { nodes: [], links: [] };

  const visibleQueries = queryGraphs.filter(qg => qg.visible);
  if (visibleQueries.length === 0) return { nodes: [], links: [] };

  const nodeMap = new Map<string, GraphNode>();
  const nodeQueryMap = new Map<string, Set<string>>();
  const allLinks: GraphLink[] = [];

  visibleQueries.forEach(queryGraph => {
    const { id: queryId, layerPapers, currentDepth, color } = queryGraph;
    
    const allVisiblePapers: Paper[] = [];
    for (let layer = 1; layer <= (currentDepth || 1); layer++) {
      if (layerPapers && layerPapers[layer] && layerPapers[layer].length > 0) {
        allVisiblePapers.push(...layerPapers[layer]);
      }
    }
    
    if (allVisiblePapers.length === 0) return;

    const graphData = transformPapersToGraph(allVisiblePapers, 1);
    
    graphData.nodes.forEach(node => {
      const nodeId = node.id;
      
      if (nodeMap.has(nodeId)) {
        const existingNode = nodeMap.get(nodeId)!;
        if (!nodeQueryMap.has(nodeId)) {
          nodeQueryMap.set(nodeId, new Set());
        }
        nodeQueryMap.get(nodeId)!.add(queryId);
        (existingNode as any).queryIds = Array.from(nodeQueryMap.get(nodeId)!);
        (existingNode as any).queryColors = (existingNode as any).queryColors || [];
        if (!(existingNode as any).queryColors.includes(color)) {
          (existingNode as any).queryColors.push(color);
        }
      } else {
        const newNode: GraphNode = {
          ...node,
          queryId,
          queryIds: [queryId],
          queryColors: [color],
          primaryColor: color,
        };
        nodeMap.set(nodeId, newNode);
        nodeQueryMap.set(nodeId, new Set([queryId]));
      }
    });

    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
        allLinks.push({
          ...link,
          source: sourceId,
          target: targetId,
          queryId,
          color,
        });
      }
    });
    
    if (createLayerLinks && currentDepth > 1) {
      for (let layer = 2; layer <= currentDepth; layer++) {
        if (layerPapers && layerPapers[layer] && layerPapers[layer].length > 0) {
          const layerLinks = createLayerLinks(layerPapers[layer], Array.from(nodeMap.values()));
          layerLinks.forEach(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            
            if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
              allLinks.push({
                ...link,
                source: sourceId,
                target: targetId,
                queryId,
                color,
                layer,
              });
            }
          });
        }
      }
    }
  });

  const nodes = Array.from(nodeMap.values());

  const linkMap = new Map<string, GraphLink>();
  allLinks.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const key = `${sourceId}-${targetId}`;
    if (!linkMap.has(key)) {
      linkMap.set(key, link);
    } else {
      const existing = linkMap.get(key)!;
      if (!(existing as any).queryIds) {
        (existing as any).queryIds = [(existing as any).queryId];
        (existing as any).queryColors = [(existing as any).color];
      }
      if (!(existing as any).queryIds.includes((link as any).queryId)) {
        (existing as any).queryIds.push((link as any).queryId);
        (existing as any).queryColors.push((link as any).color);
      }
    }
  });

  const links = Array.from(linkMap.values());
  return { nodes, links };
}

export function toggleQueryVisibility(queryGraphs: QueryGraph[], queryId: string): QueryGraph[] {
  return queryGraphs.map(qg => 
    qg.id === queryId ? { ...qg, visible: !qg.visible } : qg
  );
}

export function removeQueryGraph(queryGraphs: QueryGraph[], queryId: string): QueryGraph[] {
  return queryGraphs.filter(qg => qg.id !== queryId);
}

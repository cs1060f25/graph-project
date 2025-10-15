import type { GraphEdge, GraphNode } from "@/data/mockGraph";

export type PositionedNode = GraphNode & {
  x: number;
  y: number;
};

export type GraphState = {
  nodes: PositionedNode[];
  edges: GraphEdge[];
};

export function initializePositions(
  nodes: GraphNode[],
  width: number,
  height: number,
): PositionedNode[] {
  if (!nodes.length) {
    return [];
  }

  const angleStep = (2 * Math.PI) / nodes.length;
  const maxRadius = Math.max(Math.min(width, height) / 3, 120);
  const centerX = width / 2;
  const centerY = height / 2;

  return nodes.map((node, index) => {
    const angle = index * angleStep;
    const jitter = (index % 3) * 20;
    const radius = maxRadius * (0.6 + (index / nodes.length) * 0.4) + jitter;

    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

export function getNodeById(
  nodes: PositionedNode[],
  nodeId: string,
): PositionedNode | undefined {
  return nodes.find((node) => node.id === nodeId);
}

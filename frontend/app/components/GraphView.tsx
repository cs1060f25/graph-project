"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { theme } from "@/app/theme";
import type { GraphEdge, GraphNode } from "@/app/types/graph";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

type GraphViewProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export function GraphView({ nodes, edges }: GraphViewProps) {
  const graphData = useMemo(() => ({
    nodes: nodes.map((node) => ({
      ...node,
      color: node.is_central ? theme.colors.accentPurple : theme.colors.accentPurpleLight,
      size: node.is_central ? 12 : 8,
    })),
    links: edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      label: edge.relationship,
      confidence: edge.confidence,
    })),
  }), [nodes, edges]);

  return (
    <div
      style={{
        backgroundColor: theme.colors.graphBackground,
        borderRadius: "16px",
        border: `1px solid ${theme.colors.border}`,
        flex: 1,
        minHeight: "480px",
      }}
      aria-live="polite"
      role="presentation"
    >
      <ForceGraph2D
        width={undefined}
        height={undefined}
        graphData={graphData as any}
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const fontSize = 12 / globalScale;
          ctx.fillStyle = node.color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, 2 * Math.PI, false);
          ctx.fill();
          const label = node.label as string;
          ctx.font = `${fontSize}px ${theme.typography.fontFamily}`;
          ctx.fillStyle = theme.colors.textSecondary;
          ctx.fillText(label, node.x + node.size + 2, node.y + node.size);
        }}
        linkColor={() => theme.colors.accentGray}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={(link: any) => Math.ceil(link.confidence * 2)}
        enableNodeDrag={false}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
    </div>
  );
}


"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { ForceGraph2DProps } from "react-force-graph";
import { theme } from "@/app/theme";
import type { GraphData, GraphLink, GraphNode } from "./types";

const ForceGraph2D = dynamic<ForceGraph2DProps>(() => import("react-force-graph").then((mod) => mod.ForceGraph2D), {
  ssr: false,
});

export type GraphCanvasProps = {
  data?: GraphData;
  onNodeClick?: (paperId: string) => void;
};

function buildGraph(data: GraphData | undefined) {
  if (!data) {
    return { nodes: [], links: [] };
  }

  const centerNode: GraphNode = {
    id: data.center.id,
    label: data.center.title,
    isCenter: true,
    paper: data.center,
  };

  const neighborNodes: GraphNode[] = data.neighbors.map((paper) => ({
    id: paper.id,
    label: paper.title,
    isCenter: false,
    paper,
  }));

  const edgeLinks: GraphLink[] = data.edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
    relation: edge.relation,
  }));

  return {
    nodes: [centerNode, ...neighborNodes],
    links: edgeLinks,
  };
}

const GraphCanvasComponent = ({ data, onNodeClick }: GraphCanvasProps) => {
  const graphData = useMemo(() => buildGraph(data), [data]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [{ width, height }, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: nextWidth, height: nextHeight } = entry.contentRect;
        setDimensions({ width: nextWidth, height: nextHeight });
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const canvasWidth = Math.max(width, 320);
  const canvasHeight = Math.max(height, 320);

  return (
    <div ref={containerRef} className="h-full w-full">
      <ForceGraph2D
        width={canvasWidth}
        height={canvasHeight}
        backgroundColor={theme.colors.graphBackground}
        graphData={graphData}
        nodeLabel={(node: GraphNode) => node.paper.title}
        nodeCanvasObject={(node, ctx) => {
          const gNode = node as GraphNode;
          const radius = gNode.isCenter ? 8 : 6;

          ctx.beginPath();
          ctx.arc(gNode.x ?? 0, gNode.y ?? 0, radius + (gNode.isCenter ? 2 : 0), 0, 2 * Math.PI, false);
          ctx.fillStyle = gNode.isCenter ? theme.colors.accentPurple : theme.colors.accentPurpleLight;
          ctx.fill();

          ctx.font = `${gNode.isCenter ? 12 : 10}px Inter`;
          ctx.fillStyle = theme.colors.textSecondary;
          ctx.fillText(gNode.label, (gNode.x ?? 0) + radius + 4, (gNode.y ?? 0) + 3);
        }}
        linkColor={() => theme.colors.accentGray}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.006}
        nodePointerAreaPaint={(node, color, ctx) => {
          const gNode = node as GraphNode;
          const radius = gNode.isCenter ? 10 : 8;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(gNode.x ?? 0, gNode.y ?? 0, radius, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        onNodeClick={(node) => {
          const gNode = node as GraphNode;
          onNodeClick?.(gNode.id);
        }}
        enableNodeDrag={true}
        cooldownTime={2000}
      />
    </div>
  );
};

export const GraphCanvas = memo(GraphCanvasComponent);

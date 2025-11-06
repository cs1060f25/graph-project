import React, { useMemo, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

/**
 * GraphView
 * Renders a force-directed graph for papers and their relationships.
 * Props:
 *  - data: { nodes: Array<{ id: string, label?: string }>, links: Array<{ source: string, target: string }> }
 */
export default function GraphView({ data, width = undefined, height = 500 }) {
  const fgRef = useRef();

  const graphData = useMemo(() => {
    // Ensure stable identities and defaults
    const nodes = (data?.nodes || []).map((n) => ({
      id: String(n.id),
      label: n.label || n.id,
    }));
    const links = (data?.links || []).map((l) => ({
      source: String(l.source),
      target: String(l.target),
    }));
    return { nodes, links };
  }, [data]);

  // Zoom to fit on first render
  useEffect(() => {
    const t = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(400, 20);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [graphData]);

  return (
    <div data-testid="graph-view" style={{ width: '100%', height }}>
      <ForceGraph2D
        ref={fgRef}
        width={width}
        height={height}
        graphData={graphData}
        nodeLabel={(node) => node.label}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.label;
          const fontSize = 12 / Math.sqrt(globalScale);
          ctx.font = `${fontSize}px Sans-Serif`;
          const textWidth = ctx.measureText(label).width;
          const bckgDimensions = [textWidth + 8, fontSize + 6];
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#1f2937';
          ctx.fillText(label, node.x, node.y);
        }}
        linkColor={() => '#9ca3af'}
        linkDirectionalParticles={0}
      />
    </div>
  );
}

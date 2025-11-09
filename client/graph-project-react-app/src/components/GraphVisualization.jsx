import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './GraphVisualization.css';

const GraphVisualization = ({ graphData, onNodeClick, height = 600 }) => {
  const { nodes, links } = graphData || { nodes: [], links: [] };

  // Memoize the graph data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => ({
    nodes: nodes || [],
    links: links || [],
  }), [nodes, links]);

  if (!memoizedData.nodes || memoizedData.nodes.length === 0) {
    return (
      <div className="graph-placeholder">
        <p>No data to display. Perform a query to see the graph.</p>
      </div>
    );
  }

  return (
    <div className="graph-container">
      <ForceGraph2D
        graphData={memoizedData}
        backgroundColor="#151517"
        nodeLabel={(node) => `
          <div style="padding: 12px; background: #151517; border: 1px solid #2a2a2e; border-radius: 12px; max-width: 320px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
            <div style="font-weight: 600; color: #eaeaea; font-size: 0.9375rem; margin-bottom: 8px; line-height: 1.4;">${node.title || 'Untitled'}</div>
            <div style="font-size: 0.875rem; color: #c9c9ce; margin-bottom: 4px; font-style: italic;">${node.authors ? node.authors.join(', ') : 'Unknown authors'}</div>
            ${node.year ? `<div style="font-size: 0.75rem; color: #a0a0a5; margin-bottom: 4px;">Year: ${node.year}</div>` : ''}
            ${node.citations ? `<div style="font-size: 0.75rem; color: #3a82ff; font-weight: 500;">${node.citations} citations</div>` : ''}
          </div>
        `}
        nodeColor={(node) => {
          // Dark theme color scheme based on citation count
          if (node.citations > 50) return '#3a82ff'; // High citations - bright blue
          if (node.citations > 20) return '#a0a0ff'; // Medium citations - light purple
          return '#6366f1'; // Low citations - indigo
        }}
        nodeVal={(node) => {
          // Node size based on citation count
          return Math.sqrt(node.value || node.citations || 1) * 4;
        }}
        linkColor={() => '#4a4a4e'}
        linkWidth={(link) => (link.value || 1) * 1.5}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        onNodeClick={onNodeClick}
        height={height}
        width={Math.min(window.innerWidth - 100, 1200)}
        cooldownTicks={100}
        onEngineStop={() => {
          // Graph layout is stable
        }}
      />
    </div>
  );
};

export default GraphVisualization;


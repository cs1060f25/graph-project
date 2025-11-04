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
        nodeLabel={(node) => `
          <div style="padding: 8px; background: white; border: 1px solid #ccc; border-radius: 4px; max-width: 300px;">
            <strong>${node.title || 'Untitled'}</strong><br/>
            ${node.authors ? node.authors.join(', ') : 'Unknown authors'}<br/>
            ${node.year ? `Year: ${node.year}` : ''}<br/>
            ${node.citations ? `Citations: ${node.citations}` : ''}
          </div>
        `}
        nodeColor={(node) => {
          // Color nodes based on citation count or category
          if (node.citations > 50) return '#ff6b6b'; // High citations - red
          if (node.citations > 20) return '#4ecdc4'; // Medium citations - teal
          return '#95e1d3'; // Low citations - light teal
        }}
        nodeVal={(node) => {
          // Node size based on citation count
          return Math.sqrt(node.value || node.citations || 1) * 3;
        }}
        linkColor={() => '#999'}
        linkWidth={(link) => link.value || 1}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        onNodeClick={onNodeClick}
        height={height}
        width={window.innerWidth - 100}
        cooldownTicks={100}
        onEngineStop={() => {
          // Graph layout is stable
        }}
      />
    </div>
  );
};

export default GraphVisualization;


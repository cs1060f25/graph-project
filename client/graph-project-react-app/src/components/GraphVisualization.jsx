// HW9 GRAPH-63: Enhanced Graph Node Interactions
import React, { useMemo, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './GraphVisualization.css';

const GraphVisualization = ({ graphData, onNodeClick, selectedNode, height = 600 }) => {
  const { nodes, links } = graphData || { nodes: [], links: [] };
  const [hoveredNode, setHoveredNode] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());

  // Memoize the graph data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => ({
    nodes: nodes || [],
    links: links || [],
  }), [nodes, links]);

  // GRAPH-63: Calculate connected nodes for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode || !memoizedData.links) return new Set();
    const connected = new Set([selectedNode.id]);
    memoizedData.links.forEach(link => {
      if (link.source.id === selectedNode.id || link.source === selectedNode.id) {
        connected.add(typeof link.target === 'object' ? link.target.id : link.target);
      }
      if (link.target.id === selectedNode.id || link.target === selectedNode.id) {
        connected.add(typeof link.source === 'object' ? link.source.id : link.source);
      }
    });
    return connected;
  }, [selectedNode, memoizedData.links]);

  // GRAPH-63: Handle node hover
  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
    if (node) {
      // Highlight connected nodes on hover
      const connected = new Set([node.id]);
      memoizedData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId === node.id) connected.add(targetId);
        if (targetId === node.id) connected.add(sourceId);
      });
      setHighlightedNodes(connected);
    } else {
      // Reset to only selected node's connections
      setHighlightedNodes(selectedNode ? connectedNodeIds : new Set());
    }
  }, [memoizedData.links, selectedNode, connectedNodeIds]);

  // GRAPH-63: Enhanced node color with hover, selection, and layer states
  const getNodeColor = useCallback((node) => {
    const nodeId = node.id;
    const isSelected = selectedNode && selectedNode.id === nodeId;
    const isHovered = hoveredNode && hoveredNode.id === nodeId;
    const isHighlighted = highlightedNodes.has(nodeId);
    const isConnected = selectedNode && connectedNodeIds.has(nodeId) && nodeId !== selectedNode.id;
    const layer = node.layer || 1; // Default to layer 1 if not specified

    // Selected node - bright highlight (always visible)
    if (isSelected) return '#ffd700'; // Gold for selected
    
    // Hovered node - bright blue (always visible)
    if (isHovered) return '#60a5fa'; // Light blue for hover
    
    // Connected nodes when selected - lighter blue (always visible)
    if (isConnected) return '#3a82ff'; // Bright blue for connected
    
    // Highlighted nodes on hover - medium blue (always visible)
    if (isHighlighted && hoveredNode) return '#4a90ff'; // Medium blue for highlighted
    
    // Multi-query support: Use query color if available
    if (node.queryColors && node.queryColors.length > 0) {
      // If node belongs to multiple queries, use the first color (primary)
      // For multi-query nodes, we could blend colors, but for simplicity use primary
      return node.primaryColor || node.queryColors[0];
    }
    
    // Legacy layer-based colors with distinct color families for visual distinction
    // Layer 1 (seed papers) - Bright blues/purples, full vibrancy
    if (layer === 1) {
      if (node.citations > 50) return '#3a82ff'; // High citations - bright blue
      if (node.citations > 20) return '#8b5cf6'; // Medium citations - vibrant purple
      return '#6366f1'; // Low citations - indigo
    }
    
    // Layer 2 - Green/teal color family, distinct from Layer 1
    if (layer === 2) {
      if (node.citations > 50) return '#10b981'; // High citations - emerald green
      if (node.citations > 20) return '#14b8a6'; // Medium citations - teal
      return '#06b6d4'; // Low citations - cyan
    }
    
    // Layer 3 - Orange/amber color family, distinct from Layers 1 & 2
    if (layer === 3) {
      if (node.citations > 50) return '#f59e0b'; // High citations - amber
      if (node.citations > 20) return '#fb923c'; // Medium citations - orange
      return '#f97316'; // Low citations - deep orange
    }
    
    // Fallback - default color
    return '#6366f1';
  }, [selectedNode, hoveredNode, highlightedNodes, connectedNodeIds]);

  // GRAPH-63: Enhanced node size with selection/hover states and layer-based sizing
  const getNodeSize = useCallback((node) => {
    const baseSize = Math.sqrt(node.value || node.citations || 1) * 4;
    const nodeId = node.id;
    const isSelected = selectedNode && selectedNode.id === nodeId;
    const isHovered = hoveredNode && hoveredNode.id === nodeId;
    const layer = node.layer || 1;
    
    // Make selected/hovered nodes slightly larger (always)
    if (isSelected) return baseSize * 1.3;
    if (isHovered) return baseSize * 1.2;
    
    // Layer-based size scaling: More pronounced differences
    // Layer 1 = full size, Layer 2 = 75%, Layer 3 = 50%
    const layerScale = layer === 1 ? 1 : layer === 2 ? 0.75 : 0.5;
    return baseSize * layerScale;
  }, [selectedNode, hoveredNode]);

  // GRAPH-63: Enhanced link color based on selection/hover and layer
  const getLinkColor = useCallback((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkLayer = link.layer || 1;
    
    // Highlight links connected to selected or hovered node (always bright)
    if (selectedNode) {
      const selectedId = selectedNode.id;
      if (sourceId === selectedId || targetId === selectedId) {
        return '#3a82ff'; // Bright blue for selected node's links
      }
    }
    
    if (hoveredNode) {
      const hoveredId = hoveredNode.id;
      if (sourceId === hoveredId || targetId === hoveredId) {
        return '#60a5fa'; // Light blue for hovered node's links
      }
    }
    
    // Dim links not connected to highlighted nodes
    if (highlightedNodes.size > 0) {
      if (!highlightedNodes.has(sourceId) && !highlightedNodes.has(targetId)) {
        return '#2a2a2e'; // Very dim for non-highlighted
      }
    }
    
    // Multi-query support: Use query color for links if available
    if (link.color) {
      return link.color;
    }
    
    if (link.queryColors && link.queryColors.length > 0) {
      // If link belongs to multiple queries, use the first color
      return link.queryColors[0];
    }
    
    // Legacy layer-based link colors: Match the node color families
    // Layer 1 links - blue/purple tones
    if (linkLayer === 1) return '#4a4a4e'; // Default link color (gray)
    // Layer 2 links - green/teal tones
    if (linkLayer === 2) return '#10b981'; // Emerald green, slightly transparent
    // Layer 3 links - orange/amber tones
    if (linkLayer === 3) return '#f59e0b'; // Amber, slightly transparent
    
    return '#4a4a4e'; // Default link color
  }, [selectedNode, hoveredNode, highlightedNodes]);

  // GRAPH-63: Enhanced link width
  const getLinkWidth = useCallback((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    // Thicker links for selected/hovered nodes
    if (selectedNode) {
      const selectedId = selectedNode.id;
      if (sourceId === selectedId || targetId === selectedId) {
        return 3;
      }
    }
    
    if (hoveredNode) {
      const hoveredId = hoveredNode.id;
      if (sourceId === hoveredId || targetId === hoveredId) {
        return 2.5;
      }
    }
    
    return (link.value || 1) * 1.5; // Default width
  }, [selectedNode, hoveredNode]);

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
            <div style="font-size: 0.7rem; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #2a2a2e;">Click to view details</div>
          </div>
        `}
        nodeColor={getNodeColor}
        nodeVal={getNodeSize}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        onNodeClick={onNodeClick}
        onNodeHover={handleNodeHover}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const layer = node.layer || 1;
          const nodeSize = getNodeSize(node) / globalScale;
          
          // GRAPH-63: Add visual indicator for selected node
          if (selectedNode && selectedNode.id === node.id) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3 / globalScale;
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize + 5, 0, 2 * Math.PI);
            ctx.stroke();
          }
          
          // Multi-query support: Add border for nodes belonging to multiple queries
          if (node.queryColors && node.queryColors.length > 1) {
            // Node belongs to multiple queries - draw multi-color border
            const colors = node.queryColors;
            const segmentAngle = (2 * Math.PI) / colors.length;
            
            colors.forEach((color, index) => {
              ctx.strokeStyle = color;
              ctx.lineWidth = 2 / globalScale;
              ctx.beginPath();
              ctx.arc(
                node.x, 
                node.y, 
                nodeSize + 3, 
                index * segmentAngle, 
                (index + 1) * segmentAngle
              );
              ctx.stroke();
            });
          }
          
          // Legacy layer-based border/ring for visual distinction
          // Layer 1: No border (primary layer)
          // Layer 2: Thin green border
          // Layer 3: Thin orange border
          if (!node.queryColors && layer === 2) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5 / globalScale;
            ctx.setLineDash([3 / globalScale, 3 / globalScale]); // Dashed border
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
          } else if (!node.queryColors && layer === 3) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5 / globalScale;
            ctx.setLineDash([2 / globalScale, 2 / globalScale]); // Dashed border
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]); // Reset dash
          }
        }}
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


// HW9 GRAPH-63: Enhanced Graph Node Interactions
// GRAPH-61: Graph visualization with zoom and pan controls
// GRAPH-84: Variable node sizing with collision detection
import React, { useMemo, useState, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3Force from 'd3-force';
import './GraphVisualization.css';

const GraphVisualization = ({ graphData, onNodeClick, selectedNode, height = 600 }) => {
  const { nodes, links } = graphData || { nodes: [], links: [] };
  const [hoveredNode, setHoveredNode] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const fgRef = useRef();

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

  /**
   * Converts hex color to rgba with specified opacity
   * @param {string} hex - Hex color string (e.g., '#3a82ff')
   * @param {number} opacity - Opacity value between 0 and 1
   * @returns {string} RGBA color string
   */
  const hexToRgba = useCallback((hex, opacity) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }, []);

  /**
   * Gets layer opacity based on layer depth
   * Layer 1 = 1.0 (full opacity), Layer 2 = 0.75, Layer 3 = 0.5
   */
  const getLayerOpacity = useCallback((layer) => {
    const layerOpacityMap = {
      1: 1.0,   // Seed nodes - full opacity
      2: 0.75,  // Mid-depth - medium opacity
      3: 0.5,   // Deep layer - low opacity
    };
    return layerOpacityMap[layer] || 1.0;
  }, []);

  // Refactored node color: Query color with opacity based on layer depth
  const getNodeColor = useCallback((node) => {
    const nodeId = node.id;
    const isSelected = selectedNode && selectedNode.id === nodeId;
    const isHovered = hoveredNode && hoveredNode.id === nodeId;
    const isHighlighted = highlightedNodes.has(nodeId);
    const isConnected = selectedNode && connectedNodeIds.has(nodeId) && nodeId !== selectedNode.id;
    const layer = node.layer || 1;

    // Selected, hovered, connected, or highlighted nodes - always fully opaque for accessibility
    if (isSelected) return '#ffd700'; // Gold for selected
    if (isHovered) return '#60a5fa'; // Light blue for hover
    if (isConnected) return '#3a82ff'; // Bright blue for connected
    if (isHighlighted && hoveredNode) return '#4a90ff'; // Medium blue for highlighted
    
    // Multi-query support: Use query color with layer-based opacity
    if (node.queryColors && node.queryColors.length > 0) {
      const baseColor = node.primaryColor || node.queryColors[0];
      const opacity = getLayerOpacity(layer);
      return hexToRgba(baseColor, opacity);
    }
    
    // Legacy fallback: If no query color, use default with layer opacity
    const defaultColor = '#3a82ff'; // Blue
    const opacity = getLayerOpacity(layer);
    return hexToRgba(defaultColor, opacity);
  }, [selectedNode, hoveredNode, highlightedNodes, connectedNodeIds, hexToRgba, getLayerOpacity]);

  // GRAPH-63: Enhanced node size with selection/hover states and layer-based sizing
  // GRAPH-84: Use citation-based sizing with proper collision detection
  const getNodeSize = useCallback((node) => {
    // Get citation count or value, with minimum of 1 to ensure visibility
    const citations = node.value || node.citations || 1;
    // Use a more pronounced scaling: sqrt for smooth scaling, then multiply by larger factor
    // This makes even small differences in citation counts visible
    const baseSize = Math.sqrt(Math.max(citations, 1)) * 6 + 4; // Minimum size of 4, scales up
    const nodeId = node.id;
    const isSelected = selectedNode && selectedNode.id === nodeId;
    const isHovered = hoveredNode && hoveredNode.id === nodeId;
    const layer = node.layer || 1;
    
    // Make selected/hovered nodes slightly larger (always)
    if (isSelected) return baseSize * 1.3;
    if (isHovered) return baseSize * 1.2;
    
    // Layer-based size scaling: More pronounced differences
    // Layer 1 = full size, Layer 2 = 80%, Layer 3 = 60%
    const layerScale = layer === 1 ? 1 : layer === 2 ? 0.8 : 0.6;
    return baseSize * layerScale;
  }, [selectedNode, hoveredNode]);

  // Refactored link color: Query color with opacity based on layer depth
  const getLinkColor = useCallback((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkLayer = link.layer || 1;
    
    // Highlight links connected to selected or hovered node (always fully opaque)
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
    
    // Multi-query support: Use query color with layer-based opacity
    if (link.color) {
      const opacity = getLayerOpacity(linkLayer);
      return hexToRgba(link.color, opacity);
    }
    
    if (link.queryColors && link.queryColors.length > 0) {
      const baseColor = link.queryColors[0];
      const opacity = getLayerOpacity(linkLayer);
      return hexToRgba(baseColor, opacity);
    }
    
    // Legacy fallback: Default gray with layer opacity
    const defaultColor = '#4a4a4e';
    const opacity = getLayerOpacity(linkLayer);
    return hexToRgba(defaultColor, opacity);
  }, [selectedNode, hoveredNode, highlightedNodes, hexToRgba, getLayerOpacity]);

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

  // GRAPH-61: Zoom and pan controls
  const handleZoomIn = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoom(1.5);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoom(0.75);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 20);
    }
  }, []);

  if (!memoizedData.nodes || memoizedData.nodes.length === 0) {
    return (
      <div className="graph-placeholder">
        <p>No data to display. Perform a query to see the graph.</p>
      </div>
    );
  }

  return (
    <div className="graph-container">
      {/* GRAPH-61: Zoom controls */}
      <div className="graph-controls-overlay">
        <button 
          className="zoom-control-btn" 
          onClick={handleZoomIn}
          title="Zoom in (or use mouse wheel)"
          aria-label="Zoom in"
        >
          +
        </button>
        <button 
          className="zoom-control-btn" 
          onClick={handleZoomOut}
          title="Zoom out (or use mouse wheel)"
          aria-label="Zoom out"
        >
          −
        </button>
        <button 
          className="zoom-control-btn" 
          onClick={handleResetZoom}
          title="Reset zoom and center"
          aria-label="Reset zoom"
        >
          ⌂
        </button>
      </div>
      <ForceGraph2D
        ref={fgRef}
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
          // Draw multi-color segmented border to show all query affiliations
          if (node.queryColors && node.queryColors.length > 1) {
            const colors = node.queryColors;
            const segmentAngle = (2 * Math.PI) / colors.length;
            
            colors.forEach((color, index) => {
              // Use full opacity for borders to ensure visibility
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
          
          // Layer depth indicator: Add subtle border for deeper layers
          // Layer 2 and 3 get a dashed border to indicate depth
          if (layer === 2 || layer === 3) {
            const baseColor = node.queryColors && node.queryColors.length > 0 
              ? node.queryColors[0] 
              : '#6366f1';
            ctx.strokeStyle = baseColor;
            ctx.globalAlpha = 0.5; // Subtle border
            ctx.lineWidth = 1 / globalScale;
            ctx.setLineDash([3 / globalScale, 3 / globalScale]);
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize + 2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0; // Reset alpha
          }
        }}
        height={height}
        width={Math.min(window.innerWidth - 100, 1200)}
        cooldownTicks={100}
        // GRAPH-84: Remove link force entirely to prevent caterpillar, use only charge and collision
        d3Force={(simulation) => {
          // Remove link force completely - this prevents caterpillar/chain formation
          simulation.force('link', null);
          
          // Strong charge force to spread nodes out in all directions (not just along links)
          simulation.force('charge').strength(-400);
          simulation.force('charge').distanceMax(2000);
          
          // Strong collision detection to prevent overlap
          if (!simulation.force('collision')) {
            simulation.force('collision', d3Force.forceCollide()
              .radius((node) => {
                const nodeSize = getNodeSize(node);
                const nodeRadius = nodeSize / 2;
                // Large padding: minimum 60px gap to ensure no overlap
                return nodeRadius + Math.max(60, nodeSize * 1.0);
              })
              .strength(1.0) // Maximum collision avoidance strength
              .iterations(8) // Good number of iterations for collision resolution
            );
          } else {
            // Update existing collision force
            simulation.force('collision').radius((node) => {
              const nodeSize = getNodeSize(node);
              const nodeRadius = nodeSize / 2;
              return nodeRadius + Math.max(60, nodeSize * 1.0);
            });
            simulation.force('collision').iterations(8);
          }
        }}
        // GRAPH-61: Enable zoom and pan (built-in functionality)
        // Zoom: mouse wheel, Pan: click and drag background
        onEngineStop={() => {
          // Graph layout is stable
        }}
      />
    </div>
  );
};

export default GraphVisualization;


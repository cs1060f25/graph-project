// HW9 GRAPH-63: Enhanced Graph Node Interactions
// GRAPH-61: Graph visualization with zoom and pan controls
// GRAPH-84: Variable node sizing with collision detection
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
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

  // Compute graph width for viewport sizing
  const graphWidth = Math.min(window.innerWidth - 100, 1200);

  // GRAPH-84 Fix: Linear normalization of citations → radius scale in [1, 2] range
  // This creates consistent, proportional node sizes without over-expanding
  const getNormalizedNodeRadius = useCallback((node, nodes) => {
    if (!nodes || nodes.length === 0) return 6;
    
    // GRAPH-85: Use citations field first, then citationCount, then value, with proper handling of 0
    const citations = node.citations !== undefined && node.citations !== null
      ? node.citations
      : (node.citationCount !== undefined && node.citationCount !== null
          ? node.citationCount
          : (node.value !== undefined && node.value !== null ? node.value : 1));
    const allCitations = nodes.map(n => Math.log1p(n.citations ?? n.value ?? n.citationCount ?? 1));
    const minC = Math.min(...allCitations);
    const maxC = Math.max(...allCitations);
    const logC = Math.log1p(citations);
    const t = (logC - minC) / Math.max(1e-6, maxC - minC); // normalize 0–1
    const ratio = 1 + t; // [1,2] range
    const BASE_R = 6;
    return BASE_R * ratio;
  }, []);

  // Get node radius with layer scaling and selection/hover effects
  const getNodeRadius = useCallback((node, { forSim = false } = {}) => {
    const layer = node.layer || 1;
    const layerScale = layer === 1 ? 1 : layer === 2 ? 0.8 : 0.6;
    
    // Get base radius from normalized scaler
    let radius = getNormalizedNodeRadius(node, memoizedData.nodes);
    
    // Apply layer scaling
    radius *= layerScale;
    
    // Apply selection/hover scaling (only for rendering, not simulation)
    if (!forSim) {
      if (selectedNode?.id === node.id) radius *= 1.3;
      else if (hoveredNode?.id === node.id) radius *= 1.2;
    }
    
    return radius;
  }, [memoizedData.nodes, selectedNode, hoveredNode, getNormalizedNodeRadius]);

  // Legacy getNodeSize for backward compatibility (returns radius, but nodeVal will use radius³)
  const getNodeSize = useCallback((node) => {
    return getNodeRadius(node);
  }, [getNodeRadius]);

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
    
    // Dim links not connected to highlighted nodes (but not too dim)
    if (highlightedNodes.size > 0) {
      if (!highlightedNodes.has(sourceId) && !highlightedNodes.has(targetId)) {
        return '#4a4a5e'; // Dim but still visible for non-highlighted
      }
    }
    
    // Multi-query support: Use query color with layer-based opacity
    if (link.color) {
      const opacity = Math.max(0.8, getLayerOpacity(linkLayer)); // Higher opacity for visibility
      return hexToRgba(link.color, opacity);
    }
    
    if (link.queryColors && link.queryColors.length > 0) {
      const baseColor = link.queryColors[0];
      const opacity = Math.max(0.8, getLayerOpacity(linkLayer)); // Higher opacity for visibility
      return hexToRgba(baseColor, opacity);
    }
    
    // Legacy fallback: Visible default color for dark background
    const defaultColor = '#8b8b93'; // Bright gray for dark background
    const opacity = Math.max(0.7, getLayerOpacity(linkLayer)); // Minimum 0.7 opacity
    return hexToRgba(defaultColor, opacity);
  }, [selectedNode, hoveredNode, highlightedNodes, hexToRgba, getLayerOpacity]);

  // GRAPH-63: Enhanced link width - make edges more visible
  const getLinkWidth = useCallback((link) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    // Thicker links for selected/hovered nodes
    if (selectedNode) {
      const selectedId = selectedNode.id;
      if (sourceId === selectedId || targetId === selectedId) {
        return 4;
      }
    }
    
    if (hoveredNode) {
      const hoveredId = hoveredNode.id;
      if (sourceId === hoveredId || targetId === hoveredId) {
        return 3;
      }
    }
    
    // Default width - thick enough to be visible but not overwhelming
    return 2.5;
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

  // GRAPH-84: Auto-fit graph to viewport once when data first loads to show edges
  const dataKeyRef = useRef('');
  const hasAutoFittedRef = useRef(false);
  
  useEffect(() => {
    // Check if this is new data (different node IDs)
    const currentDataKey = memoizedData.nodes.length > 0 
      ? JSON.stringify(memoizedData.nodes.map(n => n.id).sort())
      : '';
    const isNewData = currentDataKey !== dataKeyRef.current && currentDataKey !== '';
    
    if (isNewData && fgRef.current && memoizedData.nodes && memoizedData.nodes.length > 0) {
      // Reset auto-fit flag for new data
      hasAutoFittedRef.current = false;
      dataKeyRef.current = currentDataKey;
      
      // Wait for simulation to stabilize, then zoom to fit ONCE
      const timer = setTimeout(() => {
        if (fgRef.current && !hasAutoFittedRef.current) {
          fgRef.current.zoomToFit(400, 50); // 50px padding to ensure edges are visible
          hasAutoFittedRef.current = true;
        }
      }, 1000); // Wait 1s for initial simulation to stabilize
      
      return () => clearTimeout(timer);
    }
  }, [memoizedData.nodes, memoizedData.links]);

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
            ${(node.citations !== undefined && node.citations !== null) || (node.citationCount !== undefined && node.citationCount !== null) 
              ? `<div style="font-size: 0.75rem; color: #3a82ff; font-weight: 500;">${node.citations ?? node.citationCount ?? 0} citations</div>` 
              : ''}
            <div style="font-size: 0.7rem; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #2a2a2e;">Click to view details</div>
          </div>
        `}
        nodeColor={getNodeColor}
        nodeRelSize={1}
        nodeVal={(node) => Math.pow(getNodeRadius(node, { forSim: true }), 3)}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkOpacity={0.6}
        linkCurvature={0}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={(link) => getLinkColor(link)}
        linkDirectionalParticles={0}
        onNodeClick={onNodeClick}
        onNodeHover={handleNodeHover}
        nodeCanvasObjectMode={() => 'replace'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const r = getNodeRadius(node) / globalScale;
          const color = getNodeColor(node);
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          // Selected node border
          if (selectedNode?.id === node.id) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3 / globalScale;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 2 / globalScale, 0, 2 * Math.PI);
            ctx.stroke();
          }

          // Multi-query segmented border
          if (node.queryColors && node.queryColors.length > 1) {
            const segAngle = (2 * Math.PI) / node.queryColors.length;
            node.queryColors.forEach((c, i) => {
              ctx.strokeStyle = c;
              ctx.lineWidth = 1.5 / globalScale;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 2.5 / globalScale, i * segAngle, (i + 1) * segAngle);
              ctx.stroke();
            });
          }
        }}
        nodePointerAreaPaint={(node, color, ctx, globalScale) => {
          const r = getNodeRadius(node) / globalScale;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 3 / globalScale, 0, 2 * Math.PI);
          ctx.fill();
        }}
        height={height}
        width={graphWidth}
        cooldownTicks={400}
        // GRAPH-84 Fix: Balanced force simulation for proper graph clustering
        d3Force={(sim) => {
          const byId = new Map(memoizedData.nodes.map(n => [n.id, n]));
          
          // Link force to keep clusters tight
          sim.force('link', d3Force.forceLink(memoizedData.links)
            .id(d => d.id)
            .distance(l => {
              const s = typeof l.source === 'object' ? l.source : byId.get(l.source);
              const t = typeof l.target === 'object' ? l.target : byId.get(l.target);
              return getNodeRadius(s, { forSim: true }) + getNodeRadius(t, { forSim: true }) + 30;
            })
            .strength(0.15) // Keep clusters tight
          );

          // Moderate repulsion to spread nodes without flinging apart
          sim.force('charge', d3Force.forceManyBody().strength(-60).distanceMax(1200));
          
          // Small collision padding so edges stay visible
          sim.force('collision', d3Force.forceCollide()
            .radius(n => getNodeRadius(n, { forSim: true }) + 3)
            .iterations(3)
          );
          
          // Center force to keep graph in view
          sim.force('center', d3Force.forceCenter());
          
          // Gentle X/Y forces for better distribution
          sim.force('x', d3Force.forceX().strength(0.05));
          sim.force('y', d3Force.forceY().strength(0.05));
        }}
        // GRAPH-61: Enable zoom and pan (built-in functionality)
        // Zoom: mouse wheel, Pan: click and drag background
        onEngineStop={() => {
          // Graph layout is stable - auto-fit ONCE on initial load only
          // Don't interfere if user has already zoomed or we've already auto-fitted
          if (fgRef.current && !hasAutoFittedRef.current) {
            // Use a delay to ensure simulation is fully stable
            setTimeout(() => {
              if (fgRef.current && !hasAutoFittedRef.current) {
                fgRef.current.zoomToFit(400, 50); // 50px padding to ensure edges are visible
                hasAutoFittedRef.current = true;
              }
            }, 200);
          }
        }}
      />
    </div>
  );
};

export default GraphVisualization;


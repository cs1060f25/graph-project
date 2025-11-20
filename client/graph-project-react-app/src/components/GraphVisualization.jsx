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

  // GRAPH-84 Fix: Adaptive node radius scaling to fit within available space
  const NODE_GAP = 25; // Larger gap between nodes to ensure visible edges and no touching
  
  /**
   * Compute adaptive node radius scaling to keep graph within available space.
   * Ensures total node area <= φ * viewport area (packing density)
   * Uses more aggressive scaling to make size differences more visible
   */
  const computeNodeRadiusScaler = useCallback((nodes, width, height, opts = {}) => {
    const {
      minR = 5,            // smallest radius (px) - increased for visibility
      maxR = 120,          // cap large nodes - much larger for drastic size differences
      phi = 0.25,          // target packing density - reduced to allow larger nodes
      scaleMode = 'power'  // 'power' for more visible differences
    } = opts;

    if (!nodes?.length) return (n) => minR;

    // derive weights from citation counts with more aggressive scaling
    const weights = nodes.map((n) => {
      const c = Math.max(n.citations ?? n.value ?? n.citationCount ?? 1, 1);
      if (scaleMode === 'power') {
        // Use power function (c^0.75) for more drastic size differences
        return Math.pow(c, 0.75);
      } else if (scaleMode === 'log') {
        return Math.log1p(c);
      } else {
        return Math.sqrt(c);
      }
    });

    const totalWeightSq = weights.reduce((s, w) => s + w * w, 0);
    const areaBudget = phi * width * height;

    // k ensures total circle area <= budget
    const k = Math.sqrt(areaBudget / (Math.PI * totalWeightSq));

    // build radius function with more aggressive scaling
    return (node) => {
      const c = Math.max(node.citations ?? node.value ?? node.citationCount ?? 1, 1);
      let w;
      if (scaleMode === 'power') {
        // Power function for more drastic size differences
        w = Math.pow(c, 0.75);
      } else if (scaleMode === 'log') {
        w = Math.log1p(c);
      } else {
        w = Math.sqrt(c);
      }
      
      // Calculate base radius
      let r = k * w;
      
      // Normalize to minR-maxR range for maximum visibility
      // This ensures we use the full range even if k is small
      const normalizedWeight = (w - Math.min(...weights)) / (Math.max(...weights) - Math.min(...weights) || 1);
      const targetR = minR + normalizedWeight * (maxR - minR);
      
      // Use the larger of the two to ensure we use the full range
      r = Math.max(r, targetR * 0.8); // Blend both approaches
      r = Math.min(maxR, Math.max(minR, r));
      
      return r;
    };
  }, []);

  // Compute adaptive radius scaler based on viewport size
  // Use more aggressive scaling to make size differences more visible
  const graphWidth = Math.min(window.innerWidth - 100, 1200);
  const baseRadiusScaler = useMemo(
    () => computeNodeRadiusScaler(memoizedData.nodes, graphWidth, height, { 
      phi: 0.25,       // Reduced packing density to allow larger nodes
      scaleMode: 'power' // Use power scaling for more drastic differences
    }),
    [memoizedData.nodes, graphWidth, height, computeNodeRadiusScaler]
  );

  // Get node radius with layer scaling and selection/hover effects
  const getNodeRadius = useCallback((node, { forSim = false } = {}) => {
    const layer = node.layer || 1;
    const layerScale = layer === 1 ? 1 : layer === 2 ? 0.8 : 0.6;
    
    // Get base radius from adaptive scaler
    let radius = baseRadiusScaler(node);
    
    // Apply layer scaling
    radius *= layerScale;
    
    // Apply selection/hover scaling (only for rendering, not simulation)
    if (!forSim) {
      if (selectedNode?.id === node.id) radius *= 1.3;
      else if (hoveredNode?.id === node.id) radius *= 1.2;
    }
    
    return radius;
  }, [baseRadiusScaler, selectedNode, hoveredNode]);

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
    
    // Legacy fallback: Much brighter default color for maximum visibility
    const defaultColor = '#a0a0b0'; // Much brighter gray for dark background
    const opacity = Math.max(0.9, getLayerOpacity(linkLayer)); // High opacity for visibility
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
    
    // Default width - much thicker for maximum visibility
    return 3.5;
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
        nodeRelSize={1}
        nodeVal={(node) => Math.pow(getNodeRadius(node, { forSim: true }), 3)}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkOpacity={0.9}
        linkCurvature={0}
        linkDirectionalArrowLength={0}
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
        cooldownTicks={200}
        // GRAPH-84 Fix: Proper force simulation with adaptive node sizing
        d3Force={(sim) => {
          const nodesById = new Map(memoizedData.nodes.map(n => [n.id, n]));

          // Link force with very long distances to break caterpillar shape
          sim.force('link', d3Force.forceLink(memoizedData.links)
            .id(d => d.id)
            .distance(l => {
              const s = typeof l.source === 'object' ? l.source : nodesById.get(l.source);
              const t = typeof l.target === 'object' ? l.target : nodesById.get(l.target);
              const rS = getNodeRadius(s, { forSim: true });
              const rT = getNodeRadius(t, { forSim: true });
              return rS + rT + 150; // Very long links to break caterpillar shape
            })
            .strength(0.05) // Very weak link force to allow long stretching
          );

          // Much stronger repulsion to spread nodes out and break caterpillar
          sim.force('charge', d3Force.forceManyBody().strength(-300).distanceMax(3000));

          // Center force to keep graph in view
          sim.force('center', d3Force.forceCenter());

          // Collision with much larger padding to prevent any touching
          sim.force('collision', d3Force.forceCollide()
            .radius(n => getNodeRadius(n, { forSim: true }) + 20) // 20px gap to prevent clumping
            .iterations(6) // More iterations for better separation
          );

          // NO X/Y forces - they cause caterpillar shape
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


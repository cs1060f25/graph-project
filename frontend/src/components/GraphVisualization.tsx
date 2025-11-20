'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

interface Node {
  id: string;
  title?: string;
  authors?: string[];
  year?: number;
  citations?: number;
  url?: string;
  layer?: number;
  queryIds?: string[];
  queryColors?: string[];
  primaryColor?: string;
  // Properties added by react-force-graph-2d at runtime
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
  [key: string]: any; // Allow additional properties from react-force-graph-2d
}

interface Link {
  source: string | Node;
  target: string | Node;
  value?: number;
  layer?: number;
  color?: string;
  queryId?: string;
  queryColors?: string[];
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface GraphVisualizationProps {
  graphData: GraphData | null;
  onNodeClick?: (node: Node) => void;
  selectedNode?: Node | null;
  height?: number;
}

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getLayerOpacity(layer?: number): number {
  const layerOpacityMap: Record<number, number> = {
    1: 1.0,
    2: 0.75,
    3: 0.5,
  };
  return layerOpacityMap[layer || 1] || 1.0;
}

function handleNodeClick(node: Node, onNodeClick?: (node: Node) => void): void {
  if (onNodeClick) {
    onNodeClick(node);
  }
}

function initializeGraph(
  container: HTMLElement,
  data: GraphData,
  fgRef: React.RefObject<any>
): void {
  // Graph initialization is handled by react-force-graph-2d
  // This function can be used for additional setup if needed
}

export default function GraphVisualization({
  graphData,
  onNodeClick,
  selectedNode,
  height = 600,
}: GraphVisualizationProps) {
  const { nodes = [], links = [] } = graphData || { nodes: [], links: [] };
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const fgRef = useRef<any>(null);

  const memoizedData = useMemo(() => ({
    nodes: nodes || [],
    links: links || [],
  }), [nodes, links]);

  const connectedNodeIds = useMemo(() => {
    if (!selectedNode || !memoizedData.links) return new Set<string>();
    const connected = new Set([selectedNode.id]);
    memoizedData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (sourceId === selectedNode.id || sourceId === selectedNode.id) {
        connected.add(targetId);
      }
      if (targetId === selectedNode.id || targetId === selectedNode.id) {
        connected.add(sourceId);
      }
    });
    return connected;
  }, [selectedNode, memoizedData.links]);

  const handleNodeHover = useCallback((node: Node | null) => {
    setHoveredNode(node);
    if (node) {
      const connected = new Set([node.id]);
      memoizedData.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        if (sourceId === node.id) connected.add(targetId);
        if (targetId === node.id) connected.add(sourceId);
      });
      setHighlightedNodes(connected);
    } else {
      setHighlightedNodes(selectedNode ? connectedNodeIds : new Set());
    }
  }, [memoizedData.links, selectedNode, connectedNodeIds]);

  const getNodeColor = useCallback((node: Node): string => {
    const nodeId = node.id;
    const isSelected = selectedNode && selectedNode.id === nodeId;
    const isHovered = hoveredNode && hoveredNode.id === nodeId;
    const isHighlighted = highlightedNodes.has(nodeId);
    const isConnected = selectedNode && connectedNodeIds.has(nodeId) && nodeId !== selectedNode.id;
    const layer = node.layer || 1;

    if (isSelected) return '#ffd700';
    if (isHovered) return '#60a5fa';
    if (isConnected) return '#3a82ff';
    if (isHighlighted && hoveredNode) return '#4a90ff';
    
    if (node.queryColors && node.queryColors.length > 0) {
      const baseColor = node.primaryColor || node.queryColors[0];
      const opacity = getLayerOpacity(layer);
      return hexToRgba(baseColor, opacity);
    }
    
    const defaultColor = '#6366f1';
    const opacity = getLayerOpacity(layer);
    return hexToRgba(defaultColor, opacity);
  }, [selectedNode, hoveredNode, highlightedNodes, connectedNodeIds]);

  const getNodeSize = useCallback((node: Node): number => {
    const baseSize = 6;
    const nodeId = node.id;
    const isSelected = selectedNode && selectedNode.id === nodeId;
    const isHovered = hoveredNode && hoveredNode.id === nodeId;
    const layer = node.layer || 1;
    
    if (isSelected) return baseSize * 1.3;
    if (isHovered) return baseSize * 1.2;
    
    const layerScale = layer === 1 ? 1 : layer === 2 ? 0.75 : 0.5;
    return baseSize * layerScale;
  }, [selectedNode, hoveredNode]);

  const getLinkColor = useCallback((link: Link): string => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkLayer = link.layer || 1;
    
    if (selectedNode) {
      const selectedId = selectedNode.id;
      if (sourceId === selectedId || targetId === selectedId) {
        return '#3a82ff';
      }
    }
    
    if (hoveredNode) {
      const hoveredId = hoveredNode.id;
      if (sourceId === hoveredId || targetId === hoveredId) {
        return '#60a5fa';
      }
    }
    
    if (highlightedNodes.size > 0) {
      if (!highlightedNodes.has(sourceId) && !highlightedNodes.has(targetId)) {
        return '#2a2a2e';
      }
    }
    
    if (link.color) {
      const opacity = getLayerOpacity(linkLayer);
      return hexToRgba(link.color, opacity);
    }
    
    if (link.queryColors && link.queryColors.length > 0) {
      const baseColor = link.queryColors[0];
      const opacity = getLayerOpacity(linkLayer);
      return hexToRgba(baseColor, opacity);
    }
    
    const defaultColor = '#4a4a4e';
    const opacity = getLayerOpacity(linkLayer);
    return hexToRgba(defaultColor, opacity);
  }, [selectedNode, hoveredNode, highlightedNodes]);

  const getLinkWidth = useCallback((link: Link): number => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
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
    
    return (link.value || 1) * 1.5;
  }, [selectedNode, hoveredNode]);

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
      <div className="flex items-center justify-center h-[400px] bg-[#0f0f10] border border-dashed border-[#2a2a2e] rounded-2xl text-[#a0a0a5] text-[0.9375rem]">
        <p>No data to display. Perform a query to see the graph.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full border border-[#2a2a2e] rounded-2xl bg-[#151517] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:border-[#3a3a3e]">
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <button 
          className="w-9 h-9 bg-[rgba(21,21,23,0.9)] border border-[#2a2a2e] rounded-lg text-[#eaeaea] text-lg font-semibold cursor-pointer flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-[rgba(42,42,46,0.95)] hover:border-[#3a3a3e] hover:scale-105 active:scale-95"
          onClick={handleZoomIn}
          title="Zoom in (or use mouse wheel)"
          aria-label="Zoom in"
        >
          +
        </button>
        <button 
          className="w-9 h-9 bg-[rgba(21,21,23,0.9)] border border-[#2a2a2e] rounded-lg text-[#eaeaea] text-lg font-semibold cursor-pointer flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-[rgba(42,42,46,0.95)] hover:border-[#3a3a3e] hover:scale-105 active:scale-95"
          onClick={handleZoomOut}
          title="Zoom out (or use mouse wheel)"
          aria-label="Zoom out"
        >
          −
        </button>
        <button 
          className="w-9 h-9 bg-[rgba(21,21,23,0.9)] border border-[#2a2a2e] rounded-lg text-[#eaeaea] text-lg font-semibold cursor-pointer flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:bg-[rgba(42,42,46,0.95)] hover:border-[#3a3a3e] hover:scale-105 active:scale-95"
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
        nodeLabel={(node: Node) => `
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
        onNodeClick={(node: Node) => handleNodeClick(node, onNodeClick)}
        onNodeHover={handleNodeHover}
        nodeCanvasObjectMode={() => 'after'}
        nodeCanvasObject={(node: Node, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const layer = node.layer || 1;
          const nodeSize = getNodeSize(node) / globalScale;
          
          if (selectedNode && selectedNode.id === node.id) {
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 3 / globalScale;
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, nodeSize + 5, 0, 2 * Math.PI);
            ctx.stroke();
          }
          
          if (node.queryColors && node.queryColors.length > 1) {
            const colors = node.queryColors;
            const segmentAngle = (2 * Math.PI) / colors.length;
            
            colors.forEach((color, index) => {
              ctx.strokeStyle = color;
              ctx.lineWidth = 2 / globalScale;
              ctx.beginPath();
              ctx.arc(
                node.x!,
                node.y!,
                nodeSize + 3,
                index * segmentAngle,
                (index + 1) * segmentAngle
              );
              ctx.stroke();
            });
          }
          
          if (layer === 2 || layer === 3) {
            const baseColor = node.queryColors && node.queryColors.length > 0 
              ? node.queryColors[0] 
              : '#6366f1';
            ctx.strokeStyle = baseColor;
            ctx.globalAlpha = 0.5;
            ctx.lineWidth = 1 / globalScale;
            ctx.setLineDash([3 / globalScale, 3 / globalScale]);
            ctx.beginPath();
            ctx.arc(node.x!, node.y!, nodeSize + 2, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1.0;
          }
        }}
        height={height}
        width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 100, 1200) : 1200}
        cooldownTicks={100}
        onEngineStop={() => {
          // Graph layout is stable
        }}
      />
    </div>
  );
}


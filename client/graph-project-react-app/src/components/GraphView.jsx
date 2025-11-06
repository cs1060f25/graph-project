import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './GraphView.css';

/**
 * GraphView
 * Renders a force-directed graph for papers and their relationships.
 * Props:
 *  - data: { nodes: Array<{ id: string, label?: string, ...paperData }>, links: Array<{ source: string, target: string }> }
 */
export default function GraphView({ data, width = undefined, height = 600 }) {
  const fgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const isDraggingRef = useRef(false);

  const graphData = useMemo(() => {
    // Calculate node degrees (popularity) for sizing
    const linkCounts = new Map();
    (data?.links || []).forEach((link) => {
      const src = String(link.source);
      const tgt = String(link.target);
      linkCounts.set(src, (linkCounts.get(src) || 0) + 1);
      linkCounts.set(tgt, (linkCounts.get(tgt) || 0) + 1);
    });

    const nodes = (data?.nodes || []).map((n) => ({
      id: String(n.id),
      label: n.label || n.id,
      degree: linkCounts.get(String(n.id)) || 0,
      ...n, // Preserve original paper data
    }));

    const links = (data?.links || []).map((l) => ({
      source: String(l.source),
      target: String(l.target),
      strength: l.strength || 1, // Preserve connection strength
    }));

    return { nodes, links };
  }, [data]);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  const handleResetView = useCallback(() => {
    if (isDraggingRef.current) {
      return;
    }
    
    if (fgRef.current && graphData.nodes.length > 0) {
      // Calculate the actual center of mass from node positions
      const nodes = graphData.nodes;
      let sumX = 0, sumY = 0, count = 0;
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
          sumX += node.x;
          sumY += node.y;
          count++;
          
          minX = Math.min(minX, node.x);
          maxX = Math.max(maxX, node.x);
          minY = Math.min(minY, node.y);
          maxY = Math.max(maxY, node.y);
        }
      });
      
      if (count > 0) {
        const centerX = sumX / count;
        const centerY = sumY / count;
        
        // Pause the simulation during reset to prevent drift
        fgRef.current.pauseAnimation();
        
        // Calculate zoom level to fit all nodes with padding
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        const padding = 80;
        
        // Get canvas dimensions
        const canvasWidth = fgRef.current.width ? fgRef.current.width() : 800;
        const canvasHeight = fgRef.current.height ? fgRef.current.height() : 600;
        
        const zoomX = (canvasWidth - 2 * padding) / graphWidth;
        const zoomY = (canvasHeight - 2 * padding) / graphHeight;
        const zoom = Math.min(zoomX, zoomY, 3); // Cap at 3x zoom
        
        // First set zoom
        fgRef.current.zoom(zoom, 0);
        
        // Get what the screen center is currently showing
        const screenCenterX = canvasWidth / 2;
        const screenCenterY = canvasHeight / 2;
        
        // Call centerAt
        fgRef.current.centerAt(centerX, centerY, 0);
        
        // Check what the screen center shows AFTER centering
        const afterCenter = fgRef.current.screen2GraphCoords(screenCenterX, screenCenterY);
        
        // Calculate the error and apply correction if needed
        const errorX = afterCenter.x - centerX;
        const errorY = afterCenter.y - centerY;
        
        if (Math.abs(errorX) > 0.1 || Math.abs(errorY) > 0.1) {
          const correctedX = centerX - errorX;
          const correctedY = centerY - errorY;
          fgRef.current.centerAt(correctedX, correctedY, 0);
        }
        
        // Resume simulation after a brief delay
        setTimeout(() => {
          fgRef.current.resumeAnimation();
        }, 100);
      }
    }
  }, [graphData]);

  // Initialize graph position and zoom after nodes have settled
  useEffect(() => {
    if (!isInitialized && graphData.nodes.length > 0 && fgRef.current) {
      // Wait for simulation to stabilize, then reset view
      const initTimer = setTimeout(() => {
        handleResetView();
        setIsInitialized(true);
      }, 1); // Wait 1.5 seconds for nodes to settle

      return () => clearTimeout(initTimer);
    }
  }, [graphData, isInitialized, handleResetView]);

  return (
    <div className="graph-view-container" data-testid="graph-view">
      <div className="graph-controls">
        <button 
          onClick={handleResetView} 
          className="reset-view-button"
          title="Reset view to center"
        >
          🎯 Reset View
        </button>
      </div>
      <div className="graph-canvas">
        <ForceGraph2D
          ref={fgRef}
          width={width}
          height={height}
          graphData={graphData}
          backgroundColor="#ffffff"
          nodeRelSize={4}
          nodeVal={(node) => Math.max(2, Math.sqrt(node.degree + 1) * 1.5)}
          nodeColor={(node) => {
            if (selectedNode && selectedNode.id === node.id) return '#2563eb';
            if (hoveredNode && hoveredNode.id === node.id) return '#3b82f6';
            return '#111827';
          }}
          nodeLabel={() => ''}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onBackgroundClick={handleBackgroundClick}
          onNodeDrag={(node) => {
            // Prevent zooming during drag by keeping node position updated
            isDraggingRef.current = true;
            node.fx = node.x;
            node.fy = node.y;
          }}
          onNodeDragEnd={(node) => {
            // Release fixed position after drag
            node.fx = undefined;
            node.fy = undefined;
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 100);
          }}
          linkColor={() => '#d1d5db'}
          linkWidth={1.5}
          linkDirectionalParticles={0}
          linkDistance={100}
          d3VelocityDecay={0.4}
          d3AlphaDecay={0.0228}
          d3AlphaMin={0.001}
          warmupTicks={100}
          cooldownTicks={0}
          cooldownTime={15000}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
        />
      </div>

      {selectedNode && (
        <div className="node-detail-panel">
          <div className="panel-header">
            <h3>{selectedNode.label}</h3>
            <button 
              className="close-button"
              onClick={() => setSelectedNode(null)}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="panel-content">
            {selectedNode.authors && selectedNode.authors.length > 0 && (
              <div className="detail-section">
                <span className="detail-label">Authors:</span>
                <span className="detail-value">
                  {Array.isArray(selectedNode.authors) 
                    ? selectedNode.authors.join(', ') 
                    : selectedNode.authors}
                </span>
              </div>
            )}
            {selectedNode.published && (
              <div className="detail-section">
                <span className="detail-label">Published:</span>
                <span className="detail-value">
                  {new Date(selectedNode.published).getFullYear()}
                </span>
              </div>
            )}
            {selectedNode.summary && (
              <div className="detail-section">
                <span className="detail-label">Summary:</span>
                <p className="detail-summary">{selectedNode.summary}</p>
              </div>
            )}
            {selectedNode.link && (
              <div className="detail-section">
                <a 
                  href={selectedNode.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="view-paper-button"
                >
                  View Paper →
                </a>
              </div>
            )}
            <div className="detail-section">
              <span className="detail-label">Connections:</span>
              <span className="detail-value">{selectedNode.degree}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

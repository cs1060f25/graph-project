'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Panel,
  NodeTypes,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Paper Node Component
const PaperNode = ({ data, selected }: { data: { title: string; year: number; citations: string[]; concepts: string[] }; selected: boolean }) => {
  return (
    <div
      style={{
        padding: '12px',
        minWidth: 180,
        maxWidth: 220,
        border: selected ? '2px solid #3b82f6' : '1px solid #1e40af',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: '#3b82f6',
        color: 'white',
        transition: 'all 0.2s ease-in-out',
        boxShadow: selected ? '0 4px 12px rgba(59, 130, 246, 0.4)' : '0 2px 4px rgba(59, 130, 246, 0.2)',
      }}
    >
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#555' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: '#555' }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: '#555' }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{ background: '#555' }}
      />
      
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 'bold', lineHeight: 1.2 }}>
          {data.label.length > 60 ? `${data.label.substring(0, 60)}...` : data.label}
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12 }}>
            {data.year}
          </span>
          <span style={{ 
            background: 'rgba(255,255,255,0.2)', 
            color: 'white', 
            padding: '2px 6px', 
            borderRadius: 4, 
            fontSize: 10 
          }}>
            {data.venue}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {data.keywords.slice(0, 2).map((keyword) => (
          <span
            key={keyword}
            style={{ 
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10
            }}
          >
            {keyword}
          </span>
        ))}
        {data.keywords.length > 2 && (
          <span style={{ 
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 10
          }}>
            +{data.keywords.length - 2}
          </span>
        )}
      </div>
    </div>
  );
};

const nodeTypes: NodeTypes = {
  paper: PaperNode,
};

export default function ThreeLayerGraph({ initialQuery }: { initialQuery: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState({ layer1: true, layer2: false, layer3: false });
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching graph with query:', initialQuery);
      const res = await axios.post('/api/search', {
        ...initialQuery,
        layers: { alpha: 0.3, beta: 0.4, gamma: 0.3 } // Fixed weights
      });
      console.log('Graph data received:', res.data);
      setData(res.data);
    } catch (e) {
      console.error('Graph fetch error:', e);
      setError('Failed to load graph');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [initialQuery]);

  // Convert API data to React Flow format
  useEffect(() => {
    if (!data) return;

    // Filter edges based on active layers (cumulative - higher layers include lower layers)
    const filteredEdges = data.edges.filter((edge: any) => {
      // Layer 1: Show only the strongest connections (layer1 only)
      if (activeLayers.layer1 && !activeLayers.layer2 && !activeLayers.layer3) {
        return edge.layer1;
      }
      // Layer 2: Show strongest + medium connections (layer1 OR layer2)
      if (activeLayers.layer1 && activeLayers.layer2 && !activeLayers.layer3) {
        return edge.layer1 || edge.layer2;
      }
      // Layer 3: Show all connections (layer1 OR layer2 OR layer3)
      if (activeLayers.layer1 && activeLayers.layer2 && activeLayers.layer3) {
        return edge.layer1 || edge.layer2 || edge.layer3;
      }
      return false;
    });

    // Get all nodes that are connected by filtered edges
    const connectedNodeIds = new Set();
    filteredEdges.forEach((edge: any) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    const filteredNodes = data.nodes.filter((node: any) => connectedNodeIds.has(node.id));

    // Convert to React Flow format with automatic layout
    const reactFlowNodes = filteredNodes.map((node: any, index: number) => ({
      id: node.id,
      type: 'paper',
      position: { 
        x: Math.random() * 800 + 100, 
        y: Math.random() * 600 + 100 
      },
      data: {
        ...node,
        label: node.label,
        year: node.year,
        venue: node.venue,
        keywords: node.keywords,
        authors: node.authors
      }
    }));

    const reactFlowEdges = filteredEdges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'straight',
      animated: true,
      style: { 
        strokeWidth: Math.max(2, edge.weight * 6),
        stroke: '#60a5fa',
        strokeDasharray: '5,5'
      },
      label: `${edge.weight.toFixed(2)}`,
      labelStyle: { 
        fontSize: 12, 
        fill: '#60a5fa',
        fontWeight: 'bold',
        backgroundColor: '#1f2937',
        padding: '2px 4px',
        borderRadius: '3px',
        border: '1px solid #4b5563'
      }
    }));

    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [data, activeLayers, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    console.log('Node clicked:', node);
  }, []);

  const handleFitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
    }
  };

  const handleZoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  const getGraphStats = () => {
    return {
      papers: nodes.length,
      connections: edges.length,
      layer1Count: data?.layerCounts?.layer1 || 0,
      layer2Count: data?.layerCounts?.layer2 || 0,
      layer3Count: data?.layerCounts?.layer3 || 0
    };
  };

  const stats = getGraphStats();

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{ padding: 16, borderBottom: '1px solid #374151', background: '#1f2937' }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Layer depth selector */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ color: '#e5e7eb', fontSize: 14, fontWeight: 500 }}>Graph Depth:</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setActiveLayers({ layer1: true, layer2: false, layer3: false })}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #374151',
                  background: activeLayers.layer1 && !activeLayers.layer2 && !activeLayers.layer3 ? '#3b82f6' : '#1f2937',
                  color: activeLayers.layer1 && !activeLayers.layer2 && !activeLayers.layer3 ? '#fff' : '#9ca3af',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Layer 1 (Shallow)
              </button>
              <button
                onClick={() => setActiveLayers({ layer1: true, layer2: true, layer3: false })}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #374151',
                  background: activeLayers.layer1 && activeLayers.layer2 && !activeLayers.layer3 ? '#3b82f6' : '#1f2937',
                  color: activeLayers.layer1 && activeLayers.layer2 && !activeLayers.layer3 ? '#fff' : '#9ca3af',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Layer 2 (Medium)
              </button>
              <button
                onClick={() => setActiveLayers({ layer1: true, layer2: true, layer3: true })}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #374151',
                  background: activeLayers.layer1 && activeLayers.layer2 && activeLayers.layer3 ? '#3b82f6' : '#1f2937',
                  color: activeLayers.layer1 && activeLayers.layer2 && activeLayers.layer3 ? '#fff' : '#9ca3af',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Layer 3 (Deep)
              </button>
            </div>
          </div>

          {/* Layer info */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ color: '#9ca3af', fontSize: 12 }}>
              {activeLayers.layer1 && !activeLayers.layer2 && !activeLayers.layer3 && 'Layer 1: Strongest connections only'}
              {activeLayers.layer1 && activeLayers.layer2 && !activeLayers.layer3 && 'Layer 2: Strong + Medium connections'}
              {activeLayers.layer1 && activeLayers.layer2 && activeLayers.layer3 && 'Layer 3: All connections (broadest view)'}
            </span>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={handleZoomIn}
              style={{
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Zoom In
            </button>
            <button
              onClick={handleZoomOut}
              style={{
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Zoom Out
            </button>
            <button
              onClick={handleFitView}
              style={{
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid #374151',
                background: '#1f2937',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              Fit View
            </button>
          </div>

          {loading && <span style={{ color: '#9ca3af', fontSize: 12 }}>Updating...</span>}
          {error && <span style={{ color: '#ef4444', fontSize: 12 }}>{error}</span>}
        </div>

        {/* Stats */}
        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>
          {stats.papers} papers • {stats.connections} connections • 
          Layer 1: {stats.layer1Count} • Layer 2: {stats.layer2Count} • Layer 3: {stats.layer3Count}
        </div>
      </div>

      {/* Graph container */}
      <div style={{ flex: 1, background: '#1f2937' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls style={{ background: '#374151', border: '1px solid #4b5563' }} />
          <MiniMap 
            nodeColor="#3b82f6"
            nodeStrokeWidth={3}
            zoomable
            pannable
            style={{ background: '#374151', border: '1px solid #4b5563' }}
          />
          <Background variant="dots" gap={12} size={1} color="#4b5563" />
          
          <Panel position="top-center">
            {nodes.length === 0 && !loading && (
              <div style={{ 
                background: '#374151', 
                padding: 24, 
                borderRadius: 8, 
                textAlign: 'center', 
                maxWidth: 400,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '1px solid #4b5563'
              }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#e5e7eb' }}>
                  No Papers Found
                </h3>
                <p style={{ margin: 0, color: '#9ca3af' }}>
                  Try adjusting your search criteria or layer depth to see more results.
                </p>
              </div>
            )}
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
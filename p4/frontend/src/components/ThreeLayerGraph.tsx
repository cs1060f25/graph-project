'use client';

import { useEffect, useState, useCallback } from 'react';
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

// Mock data embedded directly in the component
const mockPapers = [
  { 
    id: 'p1', 
    title: 'Attention Is All You Need', 
    authors: 'Vaswani et al.', 
    year: 2017, 
    venue: 'NIPS', 
    keywords: ['transformer', 'attention', 'nlp'],
    citations: ['p2', 'p3', 'p5', 'p6', 'p8', 'p9', 'p10'],
    citedBy: [],
    concepts: ['Self-Attention', 'Multi-Head Attention', 'Positional Encoding']
  },
  { 
    id: 'p2', 
    title: 'BERT: Pre-training of Deep Bidirectional Transformers', 
    authors: 'Devlin et al.', 
    year: 2018, 
    venue: 'NAACL', 
    keywords: ['transformer', 'bert', 'nlp'],
    citations: ['p1'],
    citedBy: ['p3', 'p6', 'p8', 'p10'],
    concepts: ['Bidirectional Encoding', 'Pre-training', 'Fine-tuning']
  },
  { 
    id: 'p3', 
    title: 'GPT-3: Language Models are Few-Shot Learners', 
    authors: 'Brown et al.', 
    year: 2020, 
    venue: 'NeurIPS', 
    keywords: ['transformer', 'gpt', 'language-model'],
    citations: ['p1', 'p2'],
    citedBy: ['p6', 'p10'],
    concepts: ['Few-Shot Learning', 'In-Context Learning', 'Scaling Laws']
  },
  { 
    id: 'p4', 
    title: 'ResNet: Deep Residual Learning for Image Recognition', 
    authors: 'He et al.', 
    year: 2016, 
    venue: 'CVPR', 
    keywords: ['resnet', 'cnn', 'computer-vision'],
    citations: [],
    citedBy: ['p5', 'p7'],
    concepts: ['Residual Connections', 'Skip Connections', 'Deep Networks']
  },
  { 
    id: 'p5', 
    title: 'Vision Transformer: An Image is Worth 16x16 Words', 
    authors: 'Dosovitskiy et al.', 
    year: 2020, 
    venue: 'ICLR', 
    keywords: ['transformer', 'vision', 'computer-vision'],
    citations: ['p1', 'p4'],
    citedBy: ['p6', 'p8', 'p9'],
    concepts: ['Patch Embedding', 'Vision Transformer', 'Image Classification']
  },
  { 
    id: 'p6', 
    title: 'DALL-E: Creating Images from Text', 
    authors: 'Ramesh et al.', 
    year: 2021, 
    venue: 'ICML', 
    keywords: ['transformer', 'generation', 'multimodal'],
    citations: ['p1', 'p2', 'p3', 'p5'],
    citedBy: ['p8', 'p9'],
    concepts: ['Text-to-Image', 'Discrete VAE', 'CLIP']
  },
  { 
    id: 'p7', 
    title: 'YOLO: Real-Time Object Detection', 
    authors: 'Redmon et al.', 
    year: 2016, 
    venue: 'CVPR', 
    keywords: ['yolo', 'object-detection', 'computer-vision'],
    citations: ['p4'],
    citedBy: [],
    concepts: ['Real-Time Detection', 'Single Shot', 'Bounding Box']
  },
  { 
    id: 'p8', 
    title: 'CLIP: Learning Transferable Visual Representations', 
    authors: 'Radford et al.', 
    year: 2021, 
    venue: 'ICML', 
    keywords: ['transformer', 'clip', 'multimodal'],
    citations: ['p1', 'p2', 'p5', 'p6'],
    citedBy: ['p9'],
    concepts: ['Contrastive Learning', 'Vision-Language', 'Zero-Shot']
  },
  { 
    id: 'p9', 
    title: 'Stable Diffusion: High-Resolution Image Synthesis', 
    authors: 'Rombach et al.', 
    year: 2022, 
    venue: 'CVPR', 
    keywords: ['transformer', 'diffusion', 'generation'],
    citations: ['p1', 'p5', 'p6', 'p8'],
    citedBy: [],
    concepts: ['Latent Diffusion', 'Text-to-Image', 'Denoising']
  },
  { 
    id: 'p10', 
    title: 'Neural Machine Translation by Jointly Learning to Align and Translate', 
    authors: 'Bahdanau et al.', 
    year: 2014, 
    venue: 'ICLR', 
    keywords: ['attention', 'nlp', 'rnn'],
    citations: ['p1'],
    citedBy: [],
    concepts: ['Attention Mechanism', 'Sequence-to-Sequence', 'Alignment']
  }
];

// Helper functions
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 0.5);
  return values.map(v => (v - min) / (max - min));
}

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
      
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
        {data.title}
      </div>
      <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '4px' }}>
        {data.year}
      </div>
      <div style={{ fontSize: '11px', opacity: 0.8 }}>
        {data.concepts.slice(0, 2).join(', ')}
        {data.concepts.length > 2 && '...'}
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
  const [activeLayers, setActiveLayers] = useState({
    layer1: true,
    layer2: false,
    layer3: false
  });

  // Generate graph data based on query
  const generateGraphData = useCallback((query: any) => {
    let relevantPapers = new Set<string>();

    // Find relevant papers based on query
    if (query.keywords && query.keywords.length > 0) {
      mockPapers.forEach(p => {
        if (query.keywords.some((kw: string) => p.keywords.includes(kw.toLowerCase()))) {
          relevantPapers.add(p.id);
        }
      });
    }

    if (query.authors && query.authors.length > 0) {
      mockPapers.forEach(p => {
        if (query.authors.some((author: string) => p.authors.toLowerCase().includes(author.toLowerCase()))) {
          relevantPapers.add(p.id);
        }
      });
    }

    if (query.papers && query.papers.length > 0) {
      query.papers.forEach((paperId: string) => relevantPapers.add(paperId));
    }

    // If no specific search criteria, return a default set of papers
    if (relevantPapers.size === 0) {
      mockPapers.forEach(p => relevantPapers.add(p.id));
    }

    const paperNodes = Array.from(relevantPapers).map(id => {
      const paper = mockPapers.find(p => p.id === id);
      if (!paper) throw new Error(`Paper with id ${id} not found`);
      return {
        id: paper.id,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        venue: paper.venue,
        citations: paper.citations,
        concepts: paper.keywords
      };
    });

    const edges: Array<{
      id: string;
      source: string;
      target: string;
      weight: number;
      layer1: boolean;
      layer2: boolean;
      layer3: boolean;
    }> = [];
    const allEdgeScores: number[] = [];

    // Generate edges between all relevant papers
    for (let i = 0; i < paperNodes.length; i++) {
      for (let j = i + 1; j < paperNodes.length; j++) {
        const paperA = paperNodes[i];
        const paperB = paperNodes[j];

        // Calculate similarity scores
        const keywordsA = new Set(paperA.concepts);
        const keywordsB = new Set(paperB.concepts);
        const s_kw = jaccardSimilarity(keywordsA, keywordsB);

        const citationsA = new Set(paperA.citations);
        const citationsB = new Set(paperB.citations);
        const citedByA = new Set(mockPapers.filter(p => p.citations.includes(paperA.id)).map(p => p.id));
        const citedByB = new Set(mockPapers.filter(p => p.citations.includes(paperB.id)).map(p => p.id));
        
        const s_cite = (jaccardSimilarity(citationsA, citationsB) + jaccardSimilarity(citedByA, citedByB)) / 2;

        // Mock semantic similarity
        const s_sem = Math.random() * 0.8 + 0.1;

        const alpha = 0.3;
        const beta = 0.4;
        const gamma = 0.3;

        const edgeScore = alpha * s_kw + beta * s_cite + gamma * s_sem;
        allEdgeScores.push(edgeScore);

        edges.push({
          id: `${paperA.id}-${paperB.id}`,
          source: paperA.id,
          target: paperB.id,
          weight: edgeScore,
          layer1: false,
          layer2: false,
          layer3: false,
        });
      }
    }

    if (allEdgeScores.length === 0) {
      return { nodes: paperNodes, edges: [] };
    }

    const normalizedScores = minMaxNormalize(allEdgeScores);

    // Calculate thresholds for layers
    const sortedScores = [...normalizedScores].sort((a, b) => b - a);
    const t1 = sortedScores[Math.floor(sortedScores.length * 0.1)] || 0.8; // Layer 1: top 10% - strongest
    const t2 = sortedScores[Math.floor(sortedScores.length * 0.4)] || 0.6; // Layer 2: top 40% - strong + medium  
    const t3 = sortedScores[Math.floor(sortedScores.length * 0.7)] || 0.4; // Layer 3: top 70% - all strong connections

    // Assign layers to edges
    edges.forEach((edge, index) => {
      edge.weight = normalizedScores[index];
      edge.layer1 = edge.weight >= t1;
      edge.layer2 = edge.weight >= t2;
      edge.layer3 = edge.weight >= t3;
    });

    return { nodes: paperNodes, edges };
  }, []);

  // Update graph when query or layers change
  useEffect(() => {
    const data = generateGraphData(initialQuery);
    
    // Filter edges based on active layers
    const filteredEdges = data.edges.filter((edge: any) => {
      if (activeLayers.layer1 && !activeLayers.layer2 && !activeLayers.layer3) {
        return edge.layer1; // Layer 1: Strongest connections only
      }
      if (activeLayers.layer1 && activeLayers.layer2 && !activeLayers.layer3) {
        return edge.layer1 || edge.layer2; // Layer 2: Strong + Medium connections
      }
      if (activeLayers.layer1 && activeLayers.layer2 && activeLayers.layer3) {
        return edge.layer1 || edge.layer2 || edge.layer3; // Layer 3: All connections
      }
      return false;
    });

    // Convert to React Flow format
    const reactFlowNodes = data.nodes.map((node: any) => ({
      id: node.id,
      type: 'paper',
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      data: {
        title: node.title,
        year: node.year,
        citations: node.citations || [],
        concepts: node.concepts || []
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
  }, [initialQuery, activeLayers, generateGraphData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const toggleLayer = (layer: 'layer1' | 'layer2' | 'layer3') => {
    setActiveLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1f2937' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        nodeTypes={nodeTypes}
        fitView
        style={{ background: '#1f2937' }}
      >
        <Background color="#374151" gap={20} />
        <Controls />
        <MiniMap 
          style={{ background: '#1f2937' }}
          nodeColor="#3b82f6"
          maskColor="rgba(31, 41, 55, 0.8)"
        />
        
        <Panel position="top-right">
          <div style={{ 
            background: '#1f2937', 
            padding: '16px', 
            borderRadius: '8px',
            border: '1px solid #374151',
            color: 'white',
            minWidth: '200px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>Graph Layers</h3>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activeLayers.layer1}
                  onChange={() => toggleLayer('layer1')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px' }}>Layer 1 (Strongest)</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activeLayers.layer2}
                  onChange={() => toggleLayer('layer2')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px' }}>Layer 2 (Strong + Medium)</span>
              </label>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={activeLayers.layer3}
                  onChange={() => toggleLayer('layer3')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px' }}>Layer 3 (All Connections)</span>
              </label>
            </div>
            
            <div style={{ 
              marginTop: '12px', 
              padding: '8px', 
              background: '#374151', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <div>Nodes: {nodes.length}</div>
              <div>Edges: {edges.length}</div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
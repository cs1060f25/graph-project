import React, { useState, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import axios from 'axios';
import './App.css';

const initialNodes = [];
const initialEdges = [];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/search?query=${encodeURIComponent(searchQuery)}`);
      const papers = response.data.papers;
      
      // Create nodes from papers
      const newNodes = papers.map((paper, index) => ({
        id: paper.id,
        type: 'default',
        position: {
          x: Math.random() * 800 + 100,
          y: Math.random() * 600 + 100,
        },
        data: {
          label: (
            <div className="paper-node">
              <div className="paper-title">{paper.title}</div>
              <div className="paper-authors">{paper.authors.join(', ')}</div>
              <div className="paper-year">{paper.year} • {paper.venue}</div>
              <div className="paper-citations">Citations: {paper.citationCount}</div>
            </div>
          ),
          paper: paper,
        },
        style: {
          background: '#fff',
          border: '2px solid #2563eb',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '250px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      }));

      // Create edges based on citations
      const newEdges = [];
      papers.forEach(paper => {
        if (paper.citations) {
          paper.citations.forEach(citedId => {
            // Check if the cited paper is also in our results
            if (papers.find(p => p.id === citedId)) {
              newEdges.push({
                id: `${paper.id}-${citedId}`,
                source: paper.id,
                target: citedId,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#2563eb', strokeWidth: 2 },
                label: 'cites',
              });
            }
          });
        }
      });

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error('Error searching papers:', error);
      alert('Error searching papers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = (event, node) => {
    setSelectedPaper(node.data.paper);
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>Research Graph Explorer</h1>
        <p>Discover research papers through interactive citation networks</p>
        
        <div className="search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter keywords (e.g., 'transformer', 'deep learning', 'computer vision')"
            className="search-input"
          />
          <button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="search-button"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="main-content">
        <div className="graph-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </div>

        {selectedPaper && (
          <div className="paper-details">
            <h3>{selectedPaper.title}</h3>
            <div className="paper-meta">
              <p><strong>Authors:</strong> {selectedPaper.authors.join(', ')}</p>
              <p><strong>Year:</strong> {selectedPaper.year}</p>
              <p><strong>Venue:</strong> {selectedPaper.venue}</p>
              <p><strong>Citations:</strong> {selectedPaper.citationCount}</p>
            </div>
            <div className="paper-abstract">
              <h4>Abstract</h4>
              <p>{selectedPaper.abstract}</p>
            </div>
            <div className="paper-keywords">
              <h4>Keywords</h4>
              <div className="keyword-tags">
                {selectedPaper.keywords.map((keyword, index) => (
                  <span key={index} className="keyword-tag">{keyword}</span>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setSelectedPaper(null)}
              className="close-button"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
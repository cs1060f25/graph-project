import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GraphVisualization from '../components/GraphVisualization';
import { createMockGraphData } from '../utils/graphDataTransformer';
import './QueryPage.css';

const QueryPage = () => {
  const { user, signOut } = useAuth();
  const [graphData] = useState(createMockGraphData());
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  return (
    <div className="query-page">
      <div className="query-header">
        <div className="query-header-content">
          <div>
            <h1 className="query-title">Paper Relationship Graph</h1>
            <p className="query-subtitle">Explore connections between research papers</p>
          </div>
          <div className="user-info">
            <span>{user?.displayName || user?.email}</span>
            <button onClick={signOut} className="signout-button">Sign Out</button>
          </div>
        </div>
      </div>
      <div className="query-content">
        <div className="graph-section">
          <GraphVisualization 
            graphData={graphData} 
            onNodeClick={handleNodeClick}
            height={600}
          />
        </div>
        {selectedNode && (
          <div className="node-details">
            <h3>Selected Paper</h3>
            <p><strong>Title:</strong> {selectedNode.title}</p>
            <p><strong>Authors:</strong> {selectedNode.authors?.join(', ') || 'Unknown'}</p>
            {selectedNode.year && <p><strong>Year:</strong> {selectedNode.year}</p>}
            {selectedNode.citations && <p><strong>Citations:</strong> {selectedNode.citations}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueryPage;


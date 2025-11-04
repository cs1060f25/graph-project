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
        <h1>Query Papers</h1>
        <div className="user-info">
          <span>Welcome, {user?.displayName || user?.email}</span>
          <button onClick={signOut} className="signout-button">Sign Out</button>
        </div>
      </div>
      <div className="query-content">
        <div className="graph-section">
          <h2>Paper Relationship Graph</h2>
          <GraphVisualization 
            graphData={graphData} 
            onNodeClick={handleNodeClick}
            height={600}
          />
        </div>
        {selectedNode && (
          <div className="node-details">
            <h3>Selected Paper Details</h3>
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


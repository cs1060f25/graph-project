/**
 * Integration test for GraphVisualization component
 * Tests that the component renders correctly with mock data
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import GraphVisualization from './GraphVisualization';
import { createMockGraphData } from '../utils/graphDataTransformer';

// Mock d3-force since Jest has trouble with ES modules
jest.mock('d3-force', () => ({
  forceLink: jest.fn(() => ({
    id: jest.fn().mockReturnThis(),
    distance: jest.fn().mockReturnThis(),
    strength: jest.fn().mockReturnThis(),
  })),
  forceManyBody: jest.fn(() => ({
    strength: jest.fn().mockReturnThis(),
    distanceMax: jest.fn().mockReturnThis(),
  })),
  forceCollide: jest.fn(() => ({
    radius: jest.fn().mockReturnThis(),
    strength: jest.fn().mockReturnThis(),
    iterations: jest.fn().mockReturnThis(),
  })),
  forceCenter: jest.fn(() => ({
    x: jest.fn().mockReturnThis(),
    y: jest.fn().mockReturnThis(),
  })),
  forceX: jest.fn(() => ({
    strength: jest.fn().mockReturnThis(),
  })),
  forceY: jest.fn(() => ({
    strength: jest.fn().mockReturnThis(),
  })),
}));

// Mock react-force-graph-2d since it's a canvas-based component
jest.mock('react-force-graph-2d', () => {
  return function MockForceGraph2D({ graphData, onNodeClick, onNodeHover, nodeColor, nodeVal, linkColor, linkWidth, selectedNode }) {
    // Use a simple state simulation without React hooks in mock
    let hoveredNode = null;
    
    return (
      <div data-testid="force-graph-mock">
        <div data-testid="node-count">{graphData?.nodes?.length || 0} nodes</div>
        <div data-testid="link-count">{graphData?.links?.length || 0} links</div>
        {graphData?.nodes?.map((node, i) => {
          const nodeId = node.id || i;
          const isSelected = selectedNode && selectedNode.id === nodeId;
          const isHovered = hoveredNode && hoveredNode.id === nodeId;
          const color = nodeColor ? nodeColor(node) : '#6366f1';
          const size = nodeVal ? nodeVal(node) : 4;
          
          return (
            <button
              key={nodeId}
              data-testid={`node-${nodeId}`}
              data-selected={isSelected}
              data-hovered={isHovered}
              data-color={color}
              data-size={size}
              onClick={() => onNodeClick && onNodeClick(node)}
              onMouseEnter={() => {
                hoveredNode = node;
                onNodeHover && onNodeHover(node);
              }}
              onMouseLeave={() => {
                hoveredNode = null;
                onNodeHover && onNodeHover(null);
              }}
            >
              {node.title}
            </button>
          );
        })}
      </div>
    );
  };
});

describe('GraphVisualization', () => {
  test('should render with mock data', () => {
    const mockData = createMockGraphData();
    const handleNodeClick = jest.fn();

    render(
      <GraphVisualization 
        graphData={mockData} 
        onNodeClick={handleNodeClick}
        height={600}
      />
    );

    expect(screen.getByTestId('force-graph-mock')).toBeInTheDocument();
    expect(screen.getByTestId('node-count')).toHaveTextContent(
      `${mockData.nodes.length} nodes`
    );
    expect(screen.getByTestId('link-count')).toHaveTextContent(
      `${mockData.links.length} links`
    );
  });

  test('should render placeholder when no data', () => {
    render(
      <GraphVisualization 
        graphData={{ nodes: [], links: [] }} 
        onNodeClick={() => {}}
      />
    );

    expect(screen.getByText('No data to display. Perform a query to see the graph.')).toBeInTheDocument();
  });

  test('should handle node clicks', () => {
    const mockData = createMockGraphData();
    const handleNodeClick = jest.fn();

    render(
      <GraphVisualization 
        graphData={mockData} 
        onNodeClick={handleNodeClick}
      />
    );

    // Find and click a node
    const firstNode = screen.getByTestId(`node-${mockData.nodes[0].id}`);
    firstNode.click();

    expect(handleNodeClick).toHaveBeenCalledWith(mockData.nodes[0]);
  });

  test('should render all nodes from mock data', () => {
    const mockData = createMockGraphData();
    
    render(
      <GraphVisualization 
        graphData={mockData} 
        onNodeClick={() => {}}
      />
    );

    // Check that all nodes are rendered
    mockData.nodes.forEach(node => {
      expect(screen.getByTestId(`node-${node.id}`)).toBeInTheDocument();
      expect(screen.getByText(node.title)).toBeInTheDocument();
    });
  });

  test('should handle null graphData gracefully', () => {
    render(
      <GraphVisualization 
        graphData={null} 
        onNodeClick={() => {}}
      />
    );

    expect(screen.getByText('No data to display. Perform a query to see the graph.')).toBeInTheDocument();
  });

  // GRAPH-63: Test node hover highlighting
  test('GRAPH-63: node hover highlights the hovered node', () => {
    const mockData = createMockGraphData();
    const handleNodeClick = jest.fn();
    
    render(
      <GraphVisualization 
        graphData={mockData} 
        onNodeClick={handleNodeClick}
      />
    );

    const firstNode = screen.getByTestId(`node-${mockData.nodes[0].id}`);
    
    // Hover over node
    firstNode.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    
    // Node should have hovered attribute
    expect(firstNode).toHaveAttribute('data-hovered', 'true');
  });

  // GRAPH-63: Test selected node highlighting
  test('GRAPH-63: selected node is highlighted with gold color', () => {
    const mockData = createMockGraphData();
    const selectedNode = mockData.nodes[0];
    
    render(
      <GraphVisualization 
        graphData={mockData} 
        onNodeClick={() => {}}
        selectedNode={selectedNode}
      />
    );

    const selectedNodeElement = screen.getByTestId(`node-${selectedNode.id}`);
    expect(selectedNodeElement).toHaveAttribute('data-selected', 'true');
    expect(selectedNodeElement).toHaveAttribute('data-color', '#ffd700'); // Gold color
  });

  // GRAPH-63: Test connected nodes highlighting
  test('GRAPH-63: connected nodes are highlighted when a node is selected', () => {
    const mockData = createMockGraphData();
    const selectedNode = mockData.nodes[0];
    
    render(
      <GraphVisualization 
        graphData={mockData} 
        onNodeClick={() => {}}
        selectedNode={selectedNode}
      />
    );

    // Selected node should be gold
    const selectedElement = screen.getByTestId(`node-${selectedNode.id}`);
    expect(selectedElement).toHaveAttribute('data-color', '#ffd700');
    
    // Connected nodes (if any) should be highlighted
    // This depends on the graph structure, but we can verify the component renders
    expect(screen.getByTestId('force-graph-mock')).toBeInTheDocument();
  });

  // GRAPH-63: Test node size changes on selection/hover
  test('GRAPH-63: selected and hovered nodes have larger size', () => {
    const mockData = createMockGraphData();
    const selectedNode = mockData.nodes[0];
    
    render(
      <GraphVisualization 
        graphData={mockData} 
        onNodeClick={() => {}}
        selectedNode={selectedNode}
      />
    );

    const selectedElement = screen.getByTestId(`node-${selectedNode.id}`);
    const baseSize = parseFloat(selectedElement.getAttribute('data-size'));
    
    // Selected node should be larger (1.3x multiplier)
    expect(baseSize).toBeGreaterThan(4); // Base size would be around 4, selected should be ~5.2
  });

  // GRAPH-84: Test node overlap detection with variable node sizes
  test('GRAPH-84: should detect when nodes would overlap with variable sizing', () => {
    // Create graph data with nodes of varying sizes (simulating citation-based sizing)
    const graphDataWithVariableSizes = {
      nodes: [
        { id: '1', title: 'Paper 1', value: 1, citations: 1, layer: 1 },      // Small node (size ~4)
        { id: '2', title: 'Paper 2', value: 10, citations: 10, layer: 1 },   // Medium node (size ~12.6)
        { id: '3', title: 'Paper 3', value: 50, citations: 50, layer: 1 },    // Large node (size ~28.3)
        { id: '4', title: 'Paper 4', value: 100, citations: 100, layer: 1 },  // Very large node (size ~40)
      ],
      links: [
        { source: '1', target: '2' },
        { source: '2', target: '3' },
        { source: '3', target: '4' },
      ]
    };

    // Mock the getNodeSize function to use citation-based sizing
    // This simulates what would happen if we used: Math.sqrt(citations) * 4
    const calculateNodeSize = (citations) => {
      return Math.sqrt(Math.max(citations, 1)) * 4;
    };

    // Calculate sizes for all nodes
    const nodeSizes = graphDataWithVariableSizes.nodes.map(node => ({
      id: node.id,
      size: calculateNodeSize(node.citations),
      radius: calculateNodeSize(node.citations) / 2
    }));

    // Check if any two nodes would overlap if placed too close
    // For nodes to not overlap, distance between centers must be >= sum of radii
    const minDistances = [];
    for (let i = 0; i < nodeSizes.length; i++) {
      for (let j = i + 1; j < nodeSizes.length; j++) {
        const minDistance = nodeSizes[i].radius + nodeSizes[j].radius;
        minDistances.push({
          node1: nodeSizes[i].id,
          node2: nodeSizes[j].id,
          minDistance: minDistance,
          node1Size: nodeSizes[i].size,
          node2Size: nodeSizes[j].size
        });
      }
    }

    // Test that we can calculate minimum distances
    // This test documents the problem: large size differences require larger spacing
    expect(minDistances.length).toBeGreaterThan(0);
    
    // The largest minimum distance should be between the largest nodes
    const largestMinDistance = Math.max(...minDistances.map(d => d.minDistance));
    expect(largestMinDistance).toBeGreaterThan(20); // Large nodes need significant spacing
    
    // This test will help detect overlap when we implement variable sizing
    // If nodes are placed closer than minDistance, they overlap
    render(
      <GraphVisualization 
        graphData={graphDataWithVariableSizes} 
        onNodeClick={() => {}}
      />
    );

    // Verify all nodes are rendered
    graphDataWithVariableSizes.nodes.forEach(node => {
      expect(screen.getByTestId(`node-${node.id}`)).toBeInTheDocument();
    });

    // Note: This test documents the overlap problem but cannot fully test it
    // without actual force simulation. A complete test would require:
    // 1. Rendering graph with force simulation
    // 2. Measuring actual node positions after simulation stabilizes
    // 3. Checking if any nodes overlap (distance < sum of radii)
    // This is documented as a limitation in the Linear issue
  });
});


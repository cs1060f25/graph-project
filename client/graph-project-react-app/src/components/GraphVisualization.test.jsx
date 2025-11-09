/**
 * Integration test for GraphVisualization component
 * Tests that the component renders correctly with mock data
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import GraphVisualization from './GraphVisualization';
import { createMockGraphData } from '../utils/graphDataTransformer';

// Mock react-force-graph-2d since it's a canvas-based component
jest.mock('react-force-graph-2d', () => {
  return function MockForceGraph2D({ graphData, onNodeClick }) {
    return (
      <div data-testid="force-graph-mock">
        <div data-testid="node-count">{graphData?.nodes?.length || 0} nodes</div>
        <div data-testid="link-count">{graphData?.links?.length || 0} links</div>
        {graphData?.nodes?.map((node, i) => (
          <button
            key={node.id || i}
            data-testid={`node-${node.id || i}`}
            onClick={() => onNodeClick && onNodeClick(node)}
          >
            {node.title}
          </button>
        ))}
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
});


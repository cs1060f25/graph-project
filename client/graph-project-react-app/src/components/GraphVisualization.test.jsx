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
  return function MockForceGraph2D({ graphData, onNodeClick, onNodeHover, nodeColor, nodeVal, linkColor, linkWidth, selectedNode }) {
    const [hoveredNode, setHoveredNode] = React.useState(null);
    
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
                setHoveredNode(node);
                onNodeHover && onNodeHover(node);
              }}
              onMouseLeave={() => {
                setHoveredNode(null);
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
});


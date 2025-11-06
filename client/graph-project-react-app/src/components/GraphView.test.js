import React from 'react';
import { render, screen } from '@testing-library/react';
import GraphView from './GraphView';

describe('GraphView', () => {
  test('renders graph container with provided data', () => {
    const data = {
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ],
      links: [{ source: 'a', target: 'b' }],
    };

    render(<GraphView data={data} />);
    expect(screen.getByTestId('graph-view')).toBeInTheDocument();
    // The global mock from setupTests renders this element
    expect(screen.getByTestId('mock-force-graph-global')).toBeInTheDocument();
  });
});

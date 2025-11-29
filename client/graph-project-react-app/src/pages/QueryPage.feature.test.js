import React from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';
import QueryPage from './QueryPage';
import { useAuth } from '../contexts/AuthContext';

// Mock d3-force and react-force-graph-2d to avoid canvas/ESM issues when QueryPage renders GraphVisualization
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

jest.mock('react-force-graph-2d', () => {
  return function MockForceGraph2D({ graphData }) {
    return (
      <div data-testid="force-graph-mock-query-page">
        <div data-testid="node-count-query-page">{graphData?.nodes?.length || 0} nodes</div>
        <div data-testid="link-count-query-page">{graphData?.links?.length || 0} links</div>
      </div>
    );
  };
});

// Mock AuthContext for GRAPH-60 tests
jest.mock('../contexts/AuthContext');

// Mock userApi to prevent real network calls from useQueryHistory
jest.mock('../services/userApi', () => ({
  userApi: {
    getQueryHistory: jest.fn().mockResolvedValue([]),
    addQueryHistory: jest.fn().mockResolvedValue({ id: 'new', query: '', type: 'keyword', resultCount: 0, timestamp: Date.now() }),
    clearQueryHistory: jest.fn().mockResolvedValue(undefined),
  },
}));

// Helper render function used by the single bug-focused test
function setup() {
  return render(
    <MemoryRouter>
      <QueryPage />
    </MemoryRouter>
  );
}

// Single test: reproduces the duplicate-query bug in the graph/query filter UI
test('BUG: submitting the same query twice should not create duplicate active query filters', async () => {
  // Simulate an authenticated user for this test
  useAuth.mockReturnValue({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    loading: false,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  });

  // Avoid real alerts during the test
  window.alert = jest.fn();

  const makeQueryMock = jest.fn().mockResolvedValue([
    {
      id: 'paper-dup-1',
      title: 'Duplicate Query Paper',
      link: 'https://example.com/dup-paper',
      authors: ['Author X'],
      summary: 'Summary',
      published: '2021-01-01',
    },
  ]);

  APIHandlerInterface.mockImplementation(() => ({
    makeQuery: makeQueryMock,
  }));

  setup();

  const input = screen.getByPlaceholderText(/search for research papers/i);

  // First search for "quantum computing"
  await userEvent.type(input, 'quantum computing');
  const firstSubmitButton = screen.getByRole('button', { name: /search by/i });
  await userEvent.click(firstSubmitButton);

  // Wait for the Active Queries panel to appear
  const filterPanel = await screen.findByRole('region', { name: /active queries/i });

  // Second search for the same query text
  await userEvent.clear(input);
  await userEvent.type(input, 'quantum computing');
  const secondSubmitButton = screen.getByRole('button', { name: /search by/i });
  await userEvent.click(secondSubmitButton);

  // Ensure the backend was called twice with the same query
  await waitFor(() => {
    expect(makeQueryMock).toHaveBeenCalledTimes(2);
  });
  await waitFor(() => {
    expect(makeQueryMock).toHaveBeenLastCalledWith(
      'quantum computing',
      expect.any(Object)
    );
  });

  // Desired behavior: only one active query entry for "quantum computing"
  const { getAllByText } = within(filterPanel);
  const labels = getAllByText('quantum computing');
  expect(labels.length).toBe(1);
  });

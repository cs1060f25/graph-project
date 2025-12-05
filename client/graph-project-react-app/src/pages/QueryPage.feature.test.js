// src/pages/QueryPage.feature.test.js

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import QueryPage from './QueryPage';
import { useAuth } from '../contexts/AuthContext';
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';

// ---- Mocks ----

// Mock d3-force so ForceGraph-related hooks don’t explode in jsdom
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

// Mock react-force-graph-2d to a simple div so we can inspect node/link counts
jest.mock('react-force-graph-2d', () => {
  return function MockForceGraph2D({ graphData }) {
    return (
      <div data-testid="force-graph-mock-query-page">
        <div data-testid="node-count-query-page">
          {graphData?.nodes?.length || 0} nodes
        </div>
        <div data-testid="link-count-query-page">
          {graphData?.links?.length || 0} links
        </div>
      </div>
    );
  };
});

// Mock AuthContext so QueryPage thinks a user is logged in
jest.mock('../contexts/AuthContext');

// Mock userApi so query history hooks don’t hit the network
jest.mock('../services/userApi', () => ({
  userApi: {
    getQueryHistory: jest.fn().mockResolvedValue([]),
    addQueryHistory: jest.fn().mockResolvedValue({
      id: 'history-1',
      query: 'quantum computing',
      type: 'keyword',
      resultCount: 1,
      timestamp: Date.now(),
    }),
    clearQueryHistory: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock QueryHistoryPanel to fully decouple this test from its internals
jest.mock('../components/QueryHistoryPanel', () => () => (
  <div data-testid="mock-query-history-panel" />
));

// Mock APIHandlerInterface so we control makeQuery
jest.mock('../handlers/api-handler/APIHandlerInterface');

function setup(makeQueryMock) {
  // Simulate an authenticated user
  useAuth.mockReturnValue({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    loading: false,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  });

  // Avoid real alerts
  window.alert = jest.fn();

  APIHandlerInterface.mockImplementation(() => ({
    makeQuery: makeQueryMock,
  }));

  return render(
    <MemoryRouter>
      <QueryPage />
    </MemoryRouter>
  );
}

test('allows selecting author query type and routes search as author', async () => {
  const makeQueryMock = jest.fn().mockResolvedValue([]);

  setup(makeQueryMock);

  const queryTypeSelector = screen.getByTitle(/search type/i);
  await userEvent.selectOptions(queryTypeSelector, 'author');

  const input = screen.getByPlaceholderText(/search for research papers/i);
  await userEvent.type(input, 'Yann LeCun');

  const submitButton = screen.getByTitle(/search by author/i);
  await userEvent.click(submitButton);

  await waitFor(() => {
    expect(makeQueryMock).toHaveBeenCalledWith(
      'Yann LeCun',
      expect.objectContaining({ type: 'author' })
    );
  });
});

test('BUG: submitting the same query twice should not create duplicate active query filters', async () => {
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

  setup(makeQueryMock);

  // Find the search input
  const input = screen.getByPlaceholderText(
    /search for research papers/i
  );

  // Find the submit button by its title (matches your current DOM)
  const submitButton = screen.getByTitle(/search by keywords/i);

  // ----- First search for "quantum computing" -----
  await userEvent.type(input, 'quantum computing');
  await userEvent.click(submitButton);

  // Wait until the first "quantum computing" label appears somewhere in the UI
  await waitFor(() => {
    const labels = screen.getAllByText('quantum computing');
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  // ----- Second search for the same query text -----
  await userEvent.clear(input);
  await userEvent.type(input, 'quantum computing');
  await userEvent.click(submitButton);

  await waitFor(() => {
    const labels = screen.getAllByText('quantum computing');

    // 🔍 DEBUG LOG — this will appear in test output
    console.log(
      "🛑 DEBUG: Active query labels found:",
      labels.length,
      labels.map(n => n.outerHTML)
    );

    expect(labels.length).toBe(1);
    });

  // Now assert that there is still only ONE active query label for "quantum computing"
  // (This encodes your desired, de-duplicated behavior)
  await waitFor(() => {
    const labels = screen.getAllByText('quantum computing');
    expect(labels.length).toBe(1);
  });

  // Optional: confirm we actually hit the backend at least once
  expect(makeQueryMock).toHaveBeenCalled();
});

// Reuse existing patterns from QueryPage.feature.test.js
jest.mock('../services/userApi', () => ({
  userApi: {
    getQueryHistory: jest.fn().mockResolvedValue([]),
    addQueryHistory: jest
      .fn()
      .mockResolvedValue({
        id: 'new',
        query: '',
        type: 'keyword',
        resultCount: 0,
        timestamp: Date.now(),
      }),
    clearQueryHistory: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    loading: false,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  })),
}));

import React from 'react';
import { render, screen, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';
import QueryPage from './QueryPage';

// Mock GraphVisualization so we can deterministically click a node
jest.mock('../components/GraphVisualization', () => {
  return function MockGraphVisualization({ graphData, onNodeClick }) {
    const nodes = graphData?.nodes || [];
    return (
      <div data-testid="mock-graph-visualization">
        {nodes.map((node) => (
          <button
            key={node.id}
            data-testid={`graph-node-${node.id}`}
            type="button"
            onClick={() => onNodeClick && onNodeClick(node)}
          >
            {node.title || node.id}
          </button>
        ))}
      </div>
    );
  };
});

// Mock QueryHistoryPanel to avoid dealing with its internal DOM expectations
jest.mock('../components/QueryHistoryPanel', () => {
  return function MockHistoryPanel() {
    return <div data-testid="mock-history-panel" />;
  };
});

function renderQueryPage() {
  return render(
    <MemoryRouter>
      <QueryPage />
    </MemoryRouter>
  );
}

async function performSearchAndSelectFirstNode() {
  const makeQueryMock = jest.fn().mockResolvedValue([
    {
      id: 'paper-1',
      title: 'A Great Paper',
      link: 'https://example.com/paper-1',
      authors: ['Alice', 'Bob'],
      summary: 'This is a summary.',
      published: '2020-01-01',
    },
  ]);

  APIHandlerInterface.mockImplementation(() => ({
    makeQuery: makeQueryMock,
  }));

  renderQueryPage();

  const input = screen.getByPlaceholderText(/search for research papers/i);
  await userEvent.type(input, 'deep learning');

  const form = document.querySelector('.search-form');
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true }));
  });

  // Wait for graph section to appear (Paper Relationship Graph header)
  await screen.findByText(/paper relationship graph/i);

  // Wait for at least one graph node from the mocked GraphVisualization
  const nodeButton = await screen.findByTestId('graph-node-paper-1');
  await userEvent.click(nodeButton);
}

describe('Selected paper pane responsiveness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.alert = jest.fn();
    const { useAuth } = require('../contexts/AuthContext');
    useAuth.mockReturnValue({
      user: { uid: 'test-user-123', email: 'test@example.com' },
      loading: false,
      signInWithGoogle: jest.fn(),
      signOut: jest.fn(),
    });
  });

  test('desktop viewport shows selected paper pane adjacent to the graph', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1280,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 800,
    });

    await performSearchAndSelectFirstNode();

    // For medium/large screens we expect a side panel / overlay near the graph
    const pane = await screen.findByTestId('selected-paper-pane-desktop');
    expect(pane).toBeInTheDocument();
    expect(
      within(pane).getByRole('heading', { name: /selected paper/i })
    ).toBeInTheDocument();

    // Selected paper details should be immediately available in the pane
    expect(within(pane).getByText('A Great Paper')).toBeInTheDocument();
  });

  test('mobile viewport uses a scrollable selected paper section', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 667,
    });

    await performSearchAndSelectFirstNode();

    // On small screens we still expect a clearly visible, scrollable section
    const pane = await screen.findByTestId('selected-paper-pane-mobile');
    expect(pane).toBeInTheDocument();
    expect(
      within(pane).getByRole('heading', { name: /selected paper/i })
    ).toBeInTheDocument();
    expect(within(pane).getByText('A Great Paper')).toBeInTheDocument();
  });
});



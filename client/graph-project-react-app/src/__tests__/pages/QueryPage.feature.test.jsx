// src/pages/QueryPage.feature.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import QueryPage from '../../pages/QueryPage';
import { useAuth } from '../../contexts/AuthContext';
import { userApi } from '../../services/userApi';

// ---- Mocks ----

// Mock d3-force so ForceGraph-related hooks don't explode in jsdom
vi.mock('d3-force', () => ({
  forceLink: vi.fn(() => ({
    id: vi.fn().mockReturnThis(),
    distance: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis(),
  })),
  forceManyBody: vi.fn(() => ({
    strength: vi.fn().mockReturnThis(),
    distanceMax: vi.fn().mockReturnThis(),
  })),
  forceCollide: vi.fn(() => ({
    radius: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis(),
    iterations: vi.fn().mockReturnThis(),
  })),
  forceCenter: vi.fn(() => ({
    x: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis(),
  })),
  forceX: vi.fn(() => ({
    strength: vi.fn().mockReturnThis(),
  })),
  forceY: vi.fn(() => ({
    strength: vi.fn().mockReturnThis(),
  })),
}));

// Mock react-force-graph-2d to a simple div so we can inspect node/link counts
vi.mock('react-force-graph-2d', () => {
  return {
    default: function MockForceGraph2D({ graphData }) {
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
    },
  };
});

// Mock AuthContext so QueryPage thinks a user is logged in
vi.mock('../../contexts/AuthContext');

// Mock userApi so we control searchPapers and expandGraphLayer
vi.mock('../../services/userApi', () => ({
  userApi: {
    searchPapers: vi.fn(),
    expandGraphLayer: vi.fn().mockResolvedValue([]),
    generatePaperSummary: vi.fn().mockResolvedValue({
      success: true,
      summary: 'Test summary',
      error: null,
    }),
    getQueryHistory: vi.fn().mockResolvedValue([]),
    addQueryHistory: vi.fn().mockResolvedValue({
      id: 'history-1',
      query: 'quantum computing',
      type: 'keyword',
      resultCount: 1,
      timestamp: Date.now(),
    }),
    clearQueryHistory: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock QueryHistoryPanel to fully decouple this test from its internals
vi.mock('../../components/QueryHistoryPanel', () => ({
  default: () => <div data-testid="mock-query-history-panel" />,
}));

function setup(searchPapersMock) {
  // Simulate an authenticated user
  useAuth.mockReturnValue({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    token: 'test-token',
    role: 'user',
    loading: false,
    error: null,
    isNewUser: false,
    loginWithEmail: vi.fn(),
    loginWithGoogle: vi.fn(),
    signUpWithEmail: vi.fn(),
    signOut: vi.fn(),
    setError: vi.fn(),
    // Legacy method names for compatibility
    signInWithGoogle: vi.fn(),
  });

  // Avoid real alerts
  window.alert = vi.fn();

  // Setup userApi.searchPapers mock
  if (searchPapersMock) {
    userApi.searchPapers = searchPapersMock;
  }

  return render(
    <MemoryRouter>
      <QueryPage />
    </MemoryRouter>
  );
}

describe('QueryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows selecting author query type and routes search as author', async () => {
    const searchPapersMock = vi.fn().mockResolvedValue([]);

    setup(searchPapersMock);

    const queryTypeSelector = screen.getByTitle(/search type/i);
    await userEvent.selectOptions(queryTypeSelector, 'author');

    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'Yann LeCun');

    const submitButton = screen.getByTitle(/search by author/i);
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(searchPapersMock).toHaveBeenCalledWith(
        'Yann LeCun',
        expect.objectContaining({ type: 'author' })
      );
    });
  });

  it('BUG: submitting the same query twice should not create duplicate active query filters', async () => {
    const searchPapersMock = vi.fn().mockResolvedValue([
      {
        id: 'paper-dup-1',
        title: 'Duplicate Query Paper',
        link: 'https://example.com/dup-paper',
        authors: ['Author X'],
        summary: 'Summary',
        published: '2021-01-01',
      },
    ]);

    setup(searchPapersMock);

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
    expect(searchPapersMock).toHaveBeenCalled();
  });
});


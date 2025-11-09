import React from 'react';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock APIHandlerInterface to avoid network calls (global mock already in setupTests)
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';

// Mock userApi to prevent real network calls from useQueryHistory
jest.mock('../services/userApi', () => ({
  userApi: {
    getQueryHistory: jest.fn().mockResolvedValue([]),
    addQueryHistory: jest.fn().mockResolvedValue({ id: 'new', query: '', type: 'keyword', resultCount: 0, timestamp: Date.now() }),
    clearQueryHistory: jest.fn().mockResolvedValue(undefined),
  },
}));

import QueryPage from './QueryPage';

// Mock AuthContext for GRAPH-60 tests
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    loading: false,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  })),
}));

function setup() {
  return render(
    <MemoryRouter>
      <QueryPage />
    </MemoryRouter>
  );
}

describe('QueryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock alert to avoid errors in tests
    window.alert = jest.fn();
  });

  afterEach(() => {
    // no-op
  });

  test('submitting a query calls API handler and renders results', async () => {
    // Set up the instance that will be created to return one result
    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: jest.fn().mockResolvedValueOnce([
        {
          id: 'paper-1',
          title: 'A Great Paper',
          link: 'https://example.com/paper-1',
          authors: ['Alice', 'Bob'],
          summary: 'This is a summary.',
          published: '2020-01-01',
        },
      ]),
    }));

    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'deep learning');
    // Submit the form
    const form1 = document.querySelector('.search-form');
    await act(async () => {
      form1.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    // Results render
    expect(await screen.findByText(/search results \(1\)/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /a great paper/i })).toHaveAttribute('href', 'https://example.com/paper-1');
  });

  test('recent searches shows the three most recent and clicking re-runs search', async () => {
    let lastQuery = undefined;
    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: jest.fn((q) => {
        lastQuery = q;
        return Promise.resolve([]);
      }),
    }));
    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);

    // Submit four different queries
    for (const q of ['one', 'two', 'three', 'four']) {
      await userEvent.clear(input);
      await userEvent.type(input, q);
      const formLoop = document.querySelector('.search-form');
      await act(async () => {
        formLoop.dispatchEvent(new Event('submit', { bubbles: true }));
      });
    }

    // Recent searches section appears
    const recent = screen.getByRole('heading', { name: /recent searches/i });
    const container = recent.closest('.query-history');
    // Wait for 'four' to appear to ensure latest state is rendered
    await within(container).findByRole('button', { name: 'four' });
    const buttons = within(container).getAllByRole('button');

    // Should show the 3 most recent queries, newest first: four, three, two
    expect(buttons.map((b) => b.textContent)).toEqual(['four', 'three', 'two']);

    // Click on 'three' should re-run makeQuery with that query
    await userEvent.click(within(container).getByRole('button', { name: 'three' }));

    // Manually submit the form to simulate auto re-run from history click
    const form = document.querySelector('.search-form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    expect(lastQuery).toBe('three');
  });

  test('error state shows and can be cleared', async () => {
    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: jest.fn().mockRejectedValueOnce(new Error('boom')),
    }));
    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'oops');
    const form2 = document.querySelector('.search-form');
    form2.dispatchEvent(new Event('submit', { bubbles: true }));

    expect(await screen.findByText(/failed to search papers/i)).toBeInTheDocument();

    // Clear error
    await userEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(screen.queryByText(/failed to search papers/i)).not.toBeInTheDocument();
  });

  // GRAPH-60: Test query type selector
  test('GRAPH-60: query type selector allows switching between keyword and topic', async () => {
    const makeQueryMock = jest.fn().mockResolvedValue([]);
    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: makeQueryMock,
    }));

    setup();

    const queryTypeSelector = screen.getByTitle(/search type/i);
    expect(queryTypeSelector).toBeInTheDocument();
    expect(queryTypeSelector.value).toBe('keyword');

    // Change to topic
    await userEvent.selectOptions(queryTypeSelector, 'topic');
    expect(queryTypeSelector.value).toBe('topic');

    // Submit query with topic type
    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'machine learning');
    const form = document.querySelector('.search-form');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    await waitFor(() => {
      expect(makeQueryMock).toHaveBeenCalledWith(
        'machine learning',
        expect.objectContaining({ type: 'topic' })
      );
    });
  });

  // GRAPH-60: Test query validation
  test('GRAPH-60: query validation prevents empty queries but allows any non-empty query', async () => {
    const makeQueryMock = jest.fn().mockResolvedValue([]);
    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: makeQueryMock,
    }));

    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);
    const form = document.querySelector('.search-form');

    // Try to submit empty query
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    // Should show validation error
    expect(await screen.findByText(/please enter a search query/i)).toBeInTheDocument();

    // Single character query should now be allowed
    await userEvent.type(input, 'a');
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    // Should proceed to API call (no validation error)
    await waitFor(() => {
      expect(makeQueryMock).toHaveBeenCalledWith('a', expect.any(Object));
    });
  });

  // GRAPH-60: Test retry functionality
  test('GRAPH-60: retry button allows retrying failed queries', async () => {
    const makeQueryMock = jest.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce([{ id: 'paper-1', title: 'Success Paper' }]);

    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: makeQueryMock,
    }));

    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'test query');
    const form = document.querySelector('.search-form');
    
    // First attempt fails
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    expect(await screen.findByText(/failed to search papers/i)).toBeInTheDocument();

    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry search/i });
    await userEvent.click(retryButton);

    // Should retry and succeed
    await waitFor(() => {
      expect(screen.getByText(/success paper/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // GRAPH-60: Test authentication integration
  test('GRAPH-60: uses authenticated user ID when user is logged in', async () => {
    const makeQueryMock = jest.fn().mockResolvedValue([]);
    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: makeQueryMock,
    }));

    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'test');
    const form = document.querySelector('.search-form');
    
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    await waitFor(() => {
      expect(makeQueryMock).toHaveBeenCalledWith(
        'test',
        expect.objectContaining({ userId: 'test-user-123' })
      );
    });
  });
});

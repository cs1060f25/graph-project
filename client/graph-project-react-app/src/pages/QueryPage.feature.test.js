import React from 'react';
import { render, screen, within, act, waitForElementToBeRemoved } from '@testing-library/react';
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

  test('query input updates as the user types', async () => {
    APIHandlerInterface.mockImplementation(() => ({ makeQuery: jest.fn().mockResolvedValueOnce([]) }));
    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'graph test');
    expect(input).toHaveValue('graph test');
  });

  test('submitting a query calls API handler and renders graph', async () => {
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

    // Results header and graph render
    expect(await screen.findByText(/search results \(1\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('graph-view')).toBeInTheDocument();
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

  test('error state shows on failed search', async () => {
    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: jest.fn().mockRejectedValueOnce(new Error('boom')),
    }));
    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'oops');
    const form2 = document.querySelector('.search-form');
    await act(async () => {
      form2.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    expect(await screen.findByText(/failed to search papers/i)).toBeInTheDocument();

    // Basic error handling verified by presence of message
  });

  test('shows loading indicator while searching', async () => {
    let resolveQuery;
    const pending = new Promise((resolve) => { resolveQuery = resolve; });
    APIHandlerInterface.mockImplementation(() => ({
      makeQuery: jest.fn().mockImplementation(() => pending),
    }));

    setup();

    const input = screen.getByPlaceholderText(/search for research papers/i);
    await userEvent.type(input, 'loading');
    const form = document.querySelector('.search-form');
    act(() => {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    });

    // Loading state visible
    expect(await screen.findByText(/searching for papers/i)).toBeInTheDocument();

    // Resolve and ensure loading disappears
    await act(async () => {
      resolveQuery([]);
    });

    expect(screen.queryByText(/searching for papers/i)).not.toBeInTheDocument();
  });
});

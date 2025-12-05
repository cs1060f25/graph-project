import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QueryHistoryPanel from '../../components/QueryHistoryPanel';

async function expandPanel() {
  const toggle = screen.getByRole('button', { name: /history/i });
  await userEvent.click(toggle);
}

describe('QueryHistoryPanel', () => {
  it('shows unauthenticated message when user is not logged in', async () => {
    render(
      <QueryHistoryPanel
        history={[]}
        loading={false}
        error={null}
        isAuthenticated={false}
        onQueryClick={vi.fn()}
      />
    );

  await expandPanel();

    expect(screen.getByText(/login to view your search history/i)).toBeInTheDocument();
  });

  it('shows empty state when authenticated but no history', async () => {
    render(
      <QueryHistoryPanel
        history={[]}
        loading={false}
        error={null}
        isAuthenticated={true}
        onQueryClick={vi.fn()}
      />
    );

  await expandPanel();

    expect(screen.getByText(/no searches yet/i)).toBeInTheDocument();
  });

  it('renders history items and handles click', async () => {
    const onQueryClick = vi.fn();
    const history = [
      { id: '1', query: 'machine learning', type: 'keyword', timestamp: Date.now(), resultCount: 10 },
      { id: '2', query: 'graph neural networks', type: 'keyword', timestamp: Date.now() - 1000, resultCount: 5 },
    ];

    render(
      <QueryHistoryPanel
        history={history}
        loading={false}
        error={null}
        isAuthenticated={true}
        onQueryClick={onQueryClick}
        formatTimestamp={() => '1m ago'}
      />
    );

  await expandPanel();

    // Items should render
    expect(screen.getByText('machine learning')).toBeInTheDocument();
    expect(screen.getByText('graph neural networks')).toBeInTheDocument();

  // Clicking an item calls handler with query string
  await userEvent.click(screen.getByText('graph neural networks'));
    expect(onQueryClick).toHaveBeenCalledWith('graph neural networks');
  });

  it('displays valid timestamps immediately after query creation', async () => {
    const formatTimestamp = vi.fn((timestamp) => {
      // Simulate the actual formatTimestamp logic
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return 'Just now';
    });

    // Simulate a newly created query with timestamp from backend
    const history = [
      { 
        id: '1', 
        query: 'newly added query', 
        type: 'keyword', 
        timestamp: Date.now(), // Backend should return this
        resultCount: 5 
      },
    ];

    render(
      <QueryHistoryPanel
        history={history}
        loading={false}
        error={null}
        isAuthenticated={true}
        onQueryClick={vi.fn()}
        formatTimestamp={formatTimestamp}
      />
    );

    await expandPanel();

    // Verify formatTimestamp was called with the timestamp
    expect(formatTimestamp).toHaveBeenCalledWith(history[0].timestamp);
    
    // Verify it did not return "Invalid Date"
    const timestamps = screen.getAllByText(/Just now|Invalid Date/);
    timestamps.forEach(element => {
      expect(element.textContent).not.toBe('Invalid Date');
    });
  });

  it('handles missing timestamp gracefully', async () => {
    const formatTimestamp = vi.fn((timestamp) => {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return 'Just now';
    });

    // Simulate a query without timestamp (should not happen after fix)
    const history = [
      { 
        id: '1', 
        query: 'query without timestamp', 
        type: 'keyword',
        // timestamp is missing
        resultCount: 5 
      },
    ];

    render(
      <QueryHistoryPanel
        history={history}
        loading={false}
        error={null}
        isAuthenticated={true}
        onQueryClick={vi.fn()}
        formatTimestamp={formatTimestamp}
      />
    );

    await expandPanel();

    // This test documents the edge case - after our fix, timestamps should always be present
    expect(formatTimestamp).toHaveBeenCalledWith(undefined);
  });
});

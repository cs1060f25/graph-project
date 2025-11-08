import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QueryHistoryPanel from './QueryHistoryPanel';

async function expandPanel() {
  const toggle = screen.getByRole('button', { name: /history/i });
  await userEvent.click(toggle);
}

describe('QueryHistoryPanel', () => {
  test('shows unauthenticated message when user is not logged in', async () => {
    render(
      <QueryHistoryPanel
        history={[]}
        loading={false}
        error={null}
        isAuthenticated={false}
        onQueryClick={jest.fn()}
      />
    );

  await expandPanel();

    expect(screen.getByText(/login to view your search history/i)).toBeInTheDocument();
  });

  test('shows empty state when authenticated but no history', async () => {
    render(
      <QueryHistoryPanel
        history={[]}
        loading={false}
        error={null}
        isAuthenticated={true}
        onQueryClick={jest.fn()}
      />
    );

  await expandPanel();

    expect(screen.getByText(/no searches yet/i)).toBeInTheDocument();
  });

  test('renders history items and handles click', async () => {
    const onQueryClick = jest.fn();
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
});

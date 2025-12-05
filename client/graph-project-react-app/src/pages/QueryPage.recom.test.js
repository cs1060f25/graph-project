// client/src/pages/QueryPage.chips.feature.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QueryPage from './QueryPage';
import { useAuth } from '../contexts/AuthContext';

// ---- Mocks ----

// AuthContext – keep it simple, unauthenticated is fine for this test
jest.mock('../contexts/AuthContext');

// History panel – we don't care about its internals here
jest.mock('../components/QueryHistoryPanel', () => () => (
  <div data-testid="mock-query-history-panel" />
));

// Graph visualization – avoid pulling in react-force-graph-2d / canvas
jest.mock('../components/GraphVisualization', () => () => (
  <div data-testid="mock-graph-visualization" />
));

// userApi – used by useQueryHistory; prevent real network calls
jest.mock('../services/userApi', () => ({
  userApi: {
    getQueryHistory: jest.fn().mockResolvedValue([]),
    addQueryHistory: jest.fn().mockResolvedValue({
      id: 'new',
      query: '',
      type: 'keyword',
      resultCount: 0,
      timestamp: Date.now(),
    }),
    clearQueryHistory: jest.fn().mockResolvedValue(undefined),
    savePaper: jest.fn().mockResolvedValue({ success: true }),
  },
}));

// API handler – constructed in QueryPage but not actually used in this test
jest.mock('../handlers/api-handler/APIHandlerInterface', () =>
  jest.fn().mockImplementation(() => ({
    makeQuery: jest.fn(),
  }))
);

// ---- Helper render ----
function renderQueryPage() {
  useAuth.mockReturnValue({
    user: null,       // unauthenticated is fine for this interaction test
    loading: false,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  });

  return render(
    <MemoryRouter>
      <QueryPage />
    </MemoryRouter>
  );
}

// ---- Single test for the chip behavior bug ----
test('clicking example topic chips appends to the existing query instead of overwriting it', async () => {
  renderQueryPage();
  const user = userEvent.setup();

  // 1) User types some text in the search box
  const input = screen.getByPlaceholderText(/search for research papers/i);
  await user.type(input, 'graph embeddings');

  // 2) User clicks the "machine learning" example chip
  const mlChip = screen.getByRole('button', { name: /machine learning/i });
  await user.click(mlChip);

  // ✅ Expected: the typed text is preserved and the chip text is APPENDED
  expect(input).toHaveValue('graph embeddings; machine learning');

  // 3) User then clicks the "quantum computing" chip
  const qcChip = screen.getByRole('button', { name: /quantum computing/i });
  await user.click(qcChip);

  // ✅ Expected: both chips are accumulated, not replaced
  expect(input).toHaveValue('graph embeddings; machine learning; quantum computing');
});

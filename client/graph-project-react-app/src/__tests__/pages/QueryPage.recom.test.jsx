// client/src/__tests__/pages/QueryPage.recom.test.jsx

import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import QueryPage from '../../pages/QueryPage';
import { useAuth } from '../../contexts/AuthContext';

// ---- Mocks ----

// AuthContext – keep it simple, unauthenticated is fine for this test
vi.mock('../../contexts/AuthContext');

// History panel – we don't care about its internals here
vi.mock('../../components/QueryHistoryPanel', () => ({
  default: () => <div data-testid="mock-query-history-panel" />,
}));

// Graph visualization – avoid pulling in react-force-graph-2d / canvas
vi.mock('../../components/GraphVisualization', () => ({
  default: () => <div data-testid="mock-graph-visualization" />,
}));

// userApi – used by useQueryHistory; prevent real network calls
vi.mock('../../services/userApi', () => ({
  userApi: {
    searchPapers: vi.fn().mockResolvedValue([]),
    expandGraphLayer: vi.fn().mockResolvedValue([]),
    generatePaperSummary: vi.fn().mockResolvedValue({
      success: true,
      summary: 'Test summary',
      error: null,
    }),
    getQueryHistory: vi.fn().mockResolvedValue([]),
    addQueryHistory: vi.fn().mockResolvedValue({
      id: 'new',
      query: '',
      type: 'keyword',
      resultCount: 0,
      timestamp: Date.now(),
    }),
    clearQueryHistory: vi.fn().mockResolvedValue(undefined),
    savePaper: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// ---- Helper render ----
function renderQueryPage() {
  useAuth.mockReturnValue({
    user: null,       // unauthenticated is fine for this interaction test
    token: null,
    role: null,
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

  return render(
    <MemoryRouter>
      <QueryPage />
    </MemoryRouter>
  );
}

// ---- Single test for the chip behavior bug ----
describe('QueryPage', () => {
  it('clicking example topic chips appends to the existing query instead of overwriting it', async () => {
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
});


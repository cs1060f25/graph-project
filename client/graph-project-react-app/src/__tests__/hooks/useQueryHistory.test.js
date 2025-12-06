// client/src/hooks/useQueryHistory.test.js
// Tests for the useQueryHistory hook

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQueryHistory } from '../../hooks/useQueryHistory';
import { userApi } from '../../services/userApi';

// Mock the userApi
vi.mock('../../services/userApi');

describe('useQueryHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('addToHistory updates local state with timestamp from API', async () => {
    // Mock the API response to include timestamp (simulating backend fix)
    const mockNewQuery = {
      id: 'new-id',
      query: 'test query',
      type: 'keyword',
      resultCount: 10,
      timestamp: Date.now(),
      createdAt: new Date().toISOString()
    };

    vi.mocked(userApi.getQueryHistory).mockResolvedValue([]);
    vi.mocked(userApi.addQueryHistory).mockResolvedValue(mockNewQuery);

    const { result } = renderHook(() => useQueryHistory(true));

    // Wait for initial fetch to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Add a query
    await act(async () => {
      await result.current.addToHistory({
        query: 'test query',
        type: 'keyword',
        resultCount: 10
      });
    });

    // Verify the query was added to local state
    expect(result.current.history).toHaveLength(1);
    
    // CRITICAL: Verify the timestamp is present in local state
    const addedQuery = result.current.history[0];
    expect(addedQuery.timestamp).toBeDefined();
    expect(typeof addedQuery.timestamp).toBe('number');
    
    // Verify timestamp is recent (within last 5 seconds)
    const now = Date.now();
    const timeDiff = now - addedQuery.timestamp;
    expect(timeDiff).toBeGreaterThanOrEqual(0);
    expect(timeDiff).toBeLessThan(5000);
  });

  it('formatTimestamp handles valid timestamp correctly', () => {
    const { result } = renderHook(() => useQueryHistory(false));

    const now = Date.now();
    
    // Test "Just now" (< 1 minute)
    expect(result.current.formatTimestamp(now)).toBe('Just now');
    
    // Test minutes ago
    const fiveMinutesAgo = now - (5 * 60 * 1000);
    expect(result.current.formatTimestamp(fiveMinutesAgo)).toBe('5m ago');
    
    // Test hours ago
    const twoHoursAgo = now - (2 * 60 * 60 * 1000);
    expect(result.current.formatTimestamp(twoHoursAgo)).toBe('2h ago');
    
    // Test days ago
    const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000);
    expect(result.current.formatTimestamp(threeDaysAgo)).toBe('3d ago');
  });

  it('formatTimestamp handles invalid timestamp (edge case)', () => {
    const { result } = renderHook(() => useQueryHistory(false));

    // Test undefined (should not happen after fix, but testing edge case)
    const invalidResult = result.current.formatTimestamp(undefined);
    
    // The Date constructor with undefined creates Invalid Date
    // This should result in "Invalid Date" string when calling methods on it
    // The actual behavior depends on how toLocaleDateString handles Invalid Date
    expect(invalidResult).toBeTruthy(); // Just verify it returns something
  });

  it('formatTimestamp handles string timestamp (ISO format)', () => {
    const { result } = renderHook(() => useQueryHistory(false));

    const isoString = new Date().toISOString();
    const formatted = result.current.formatTimestamp(isoString);
    
    // new Date(isoString) should work correctly
    expect(formatted).toBe('Just now');
  });

  it('history is prepended in chronological order', async () => {
    const existingQuery = {
      id: 'old-id',
      query: 'old query',
      type: 'keyword',
      timestamp: Date.now() - 10000,
      resultCount: 5
    };

    const newQuery = {
      id: 'new-id',
      query: 'new query',
      type: 'keyword',
      timestamp: Date.now(),
      resultCount: 10
    };

    vi.mocked(userApi.getQueryHistory).mockResolvedValue([existingQuery]);
    vi.mocked(userApi.addQueryHistory).mockResolvedValue(newQuery);

    const { result } = renderHook(() => useQueryHistory(true));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Add new query
    await act(async () => {
      await result.current.addToHistory({
        query: 'new query',
        type: 'keyword',
        resultCount: 10
      });
    });

    // Verify new query is first
    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].id).toBe('new-id');
    expect(result.current.history[1].id).toBe('old-id');
  });

  it('clearHistory empties the history array', async () => {
    vi.mocked(userApi.getQueryHistory).mockResolvedValue([
      { id: '1', query: 'query 1', timestamp: Date.now(), type: 'keyword' },
      { id: '2', query: 'query 2', timestamp: Date.now(), type: 'keyword' }
    ]);
    vi.mocked(userApi.clearQueryHistory).mockResolvedValue();

    const { result } = renderHook(() => useQueryHistory(true));

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.history).toHaveLength(2);
    });

    // Clear history
    await act(async () => {
      await result.current.clearHistory();
    });

    // Verify history is empty
    expect(result.current.history).toHaveLength(0);
  });
});

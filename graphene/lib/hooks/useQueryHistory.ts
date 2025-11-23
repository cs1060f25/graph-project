import { useState, useEffect, useCallback } from 'react';
import { userApi, QueryHistory } from '../services/userApi';

interface UseQueryHistoryReturn {
  history: QueryHistory[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  addToHistory: (queryData: Omit<QueryHistory, 'id' | 'timestamp'>) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  clearError: () => void;
  formatTimestamp: (timestamp: string | number) => string;
}

export function useQueryHistory(isAuthenticated: boolean = false): UseQueryHistoryReturn {
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const historyData = await userApi.getQueryHistory(20);
      setHistory(historyData || []);
    } catch (err: any) {
      console.error('Error fetching query history:', err);
      setError(err.message || 'Failed to load query history');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const addToHistory = useCallback(async (queryData: Omit<QueryHistory, 'id' | 'timestamp'>) => {
    if (!isAuthenticated) return;

    try {
      const newQuery = await userApi.addQueryHistory(queryData);
      setHistory(prev => [newQuery, ...prev]);
    } catch (err) {
      console.error('Error adding to query history:', err);
    }
  }, [isAuthenticated]);

  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await userApi.clearQueryHistory();
      setHistory([]);
    } catch (err) {
      console.error('Error clearing query history:', err);
      setError('Failed to clear query history');
    }
  }, [isAuthenticated]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const formatTimestamp = useCallback((timestamp: string | number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  return {
    history,
    loading,
    error,
    isAuthenticated,
    addToHistory,
    clearHistory,
    refreshHistory: fetchHistory,
    clearError,
    formatTimestamp,
  };
}

export default useQueryHistory;

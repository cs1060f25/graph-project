// client/src/hooks/useQueryHistory.js
// React hook for managing query history

import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../services/userApi';

/**
 * Custom hook for managing query history
 * Handles fetching, adding, and clearing query history
 * 
 * @param {boolean} isAuthenticated - Whether user is logged in
 * @returns {Object} Query history state and methods
 */
export function useQueryHistory(isAuthenticated = false) {
  // State
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch query history from API
   */
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
    } catch (err) {
      console.error('Error fetching query history:', err);
      setError(err.message || 'Failed to load query history');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch history when authentication status changes
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  /**
   * Add a new query to history
   * @param {Object} queryData - Query data
   * @param {string} queryData.query - Search query text
   * @param {string} queryData.type - Query type (keyword, topic)
   * @param {number} queryData.resultCount - Number of results returned
   */
  const addToHistory = useCallback(async (queryData) => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const newQuery = await userApi.addQueryHistory(queryData);
      
      // Add to local state (prepend to maintain chronological order)
      setHistory(prev => [newQuery, ...prev]);
    } catch (err) {
      console.error('Error adding to query history:', err);
      // Don't set error for add operations to avoid disrupting user experience
    }
  }, [isAuthenticated]);

  /**
   * Clear all query history
   */
  const clearHistory = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      await userApi.clearQueryHistory();
      setHistory([]);
    } catch (err) {
      console.error('Error clearing query history:', err);
      setError('Failed to clear query history');
    }
  }, [isAuthenticated]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Format timestamp for display
   * @param {number|string} timestamp - Timestamp to format
   * @returns {string} Formatted date string
   */
  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);

  return {
    // State
    history,
    loading,
    error,
    isAuthenticated,

    // Actions
    addToHistory,
    clearHistory,
    refreshHistory: fetchHistory,
    clearError,

    // Utilities
    formatTimestamp,
  };
}

export default useQueryHistory;

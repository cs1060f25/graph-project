'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/contexts/AuthContext';
import { apiClient } from '../lib/api';
import { Paper } from '../lib/models/types';
import './PaperSummary.css';

interface PaperSummaryProps {
  paperId: string;
  paper: Paper;
}

export default function PaperSummary({ paperId, paper }: PaperSummaryProps) {
  const { token } = useAuth();
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (regenerate = false) => {
    if (!token) {
      setError('Please log in to view AI summaries');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = `/papers/summary`;
      const data = await apiClient(url, {
        method: 'POST',
        token,
        body: JSON.stringify({ paperId, paper, regenerate }),
      });
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, [paperId, paper, token]);

  useEffect(() => {
    if (paperId && paper && token) {
      fetchSummary();
    }
  }, [paperId, paper, token, fetchSummary]);

  if (!token) {
    return null;
  }

  return (
    <div className="paper-summary">
      <div className="paper-summary-header">
        <h4 className="paper-summary-title">AI Summary</h4>
        <button
          className="paper-summary-regenerate"
          onClick={() => fetchSummary(true)}
          disabled={loading}
          title="Regenerate summary"
        >
          {loading ? '⏳' : '↻'}
        </button>
      </div>

      {loading && !summary && (
        <div className="paper-summary-loading">
          <span className="paper-summary-spinner"></span>
          <span>Generating summary...</span>
        </div>
      )}

      {error && (
        <div className="paper-summary-error">
          {error}
        </div>
      )}

      {summary && !loading && (
        <p className="paper-summary-text">{summary}</p>
      )}

      {!summary && !loading && !error && (
        <p className="paper-summary-empty">No summary available</p>
      )}
    </div>
  );
}


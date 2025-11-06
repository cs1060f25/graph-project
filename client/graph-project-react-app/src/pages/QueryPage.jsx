// client/src/pages/QueryPage.jsx
// Main Query Page component with ChatGPT-style interface

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';
import QueryHistoryPanel from '../components/QueryHistoryPanel';
import { useQueryHistory } from '../hooks/useQueryHistory';
import './QueryPage.css';
import GraphView from '../components/GraphView';
import { papersToGraph } from '../utils/transformToGraph';

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);

  // Mock authentication state - in real app this would come from auth context
  const isAuthenticated = true; // TODO: Replace with actual auth state

  // Initialize API handler once
  const apiHandler = useMemo(() => new APIHandlerInterface({ maxResults: 10 }), []);

  // Memoize graph data to prevent recalculation on every render
  const graphData = useMemo(() => papersToGraph(results), [results]);

  // Query history hook
  const {
    history: dbHistory,
    loading: historyLoading,
    error: historyError,
    addToHistory,
    clearHistory,
    formatTimestamp
  } = useQueryHistory(isAuthenticated);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await apiHandler.makeQuery(query.trim(), { 
        type: "keyword",
        userId: isAuthenticated ? "authenticated-user" : "demo-user"
      });
      
      setResults(searchResults);
      
      // Add to local history for immediate display (only if not already in history)
      const trimmedQuery = query.trim();
      const isDuplicate = queryHistory.some(item => item.query === trimmedQuery);
      if (!isDuplicate && trimmedQuery) {
        const newHistoryItem = { query: trimmedQuery, timestamp: new Date() };
        setQueryHistory(prev => [newHistoryItem, ...prev]);
      }
      
      // Add to database history if authenticated
      if (isAuthenticated) {
        const historyData = {
          query: trimmedQuery,
          type: "keyword",
          resultCount: searchResults.length
        };
        console.log('[QueryPage] Adding to history:', historyData);
        const result = await addToHistory(historyData);
        console.log('[QueryPage] History add result:', result);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search papers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Note: Save functionality moved out when switching to graph results UI.

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  // Handle clicking on a query from history
  const handleHistoryQueryClick = (queryText) => {
    // Validate query text before using it
    if (!queryText || typeof queryText !== 'string' || !queryText.trim()) {
      console.warn('Invalid query text from history:', queryText);
      return;
    }
    
    setQuery(queryText);
    // Automatically trigger search
    setTimeout(() => {
      const form = document.querySelector('.search-form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  return (
    <div className="query-page">
      {/* Header */}
      <header className="query-header">
        <div className="query-header-content">
          <h1 className="query-title">Graphene</h1>
          <p className="query-subtitle">Discover and explore academic papers</p>
          
          <div className="query-nav">
            <Link to="/personal" className="nav-link">
              📚 My Saved Papers
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="query-main">
        <div className="query-container">
          {/* Search Input */}
          <div className="search-section">
            <form onSubmit={handleSubmit} className="search-form">
              <div className="search-input-container">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for research papers..."
                  className="search-input"
                  disabled={loading}
                />
                <button 
                  type="submit" 
                  className="search-button"
                  disabled={loading || !query.trim()}
                >
                  {loading ? '⏳' : '🔍'}
                </button>
              </div>
            </form>
          </div>

          {/* Query History */}
          {queryHistory.length > 0 && (
            <div className="query-history">
              <h3>Recent Searches</h3>
              <div className="history-list">
                {queryHistory.slice(0, 3).map((item, index) => (
                  <button
                    key={index}
                    className="history-item"
                    onClick={() => handleHistoryQueryClick(item.query)}
                  >
                    {item.query}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Section */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Searching for papers...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <button type="button" onClick={clearResults} className="retry-button">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="results-section">
              <div className="results-header">
                <h2>Search Results ({results.length})</h2>
                <button onClick={clearResults} className="clear-button">
                  Clear Results
                </button>
              </div>
              <GraphView data={graphData} height={600} />
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && queryHistory.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>Start Your Research Journey</h3>
              <p>Enter a research question or keywords to discover relevant academic papers.</p>
              <div className="example-queries">
                <p>Try searching for:</p>
                <div className="example-list">
                  <button 
                    className="example-query"
                    onClick={() => setQuery('machine learning')}
                  >
                    machine learning
                  </button>
                  <button 
                    className="example-query"
                    onClick={() => setQuery('artificial intelligence')}
                  >
                    artificial intelligence
                  </button>
                  <button 
                    className="example-query"
                    onClick={() => setQuery('quantum computing')}
                  >
                    quantum computing
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Query History Panel */}
      <QueryHistoryPanel
        history={dbHistory}
        loading={historyLoading}
        error={historyError}
        isAuthenticated={isAuthenticated}
        onQueryClick={handleHistoryQueryClick}
        onClearHistory={clearHistory}
        formatTimestamp={formatTimestamp}
      />
    </div>
  );
}
// client/src/pages/QueryPage.jsx
// Main Query Page component with search and graph visualization
// HW9 GRAPH-60: Enhanced Query Input & API Integration

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';
import QueryHistoryPanel from '../components/QueryHistoryPanel';
import { useQueryHistory } from '../hooks/useQueryHistory';
import GraphVisualization from '../components/GraphVisualization';
import { transformPapersToGraph } from '../utils/graphDataTransformer';
import { useAuth } from '../contexts/AuthContext';
import './QueryPage.css';

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState('keyword'); // 'keyword' or 'topic'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [queryHistory, setQueryHistory] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'graph'
  const [selectedNode, setSelectedNode] = useState(null);
  const queryInputRef = useRef(null);

  // Use actual authentication context (GRAPH-60 enhancement)
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  // Initialize API handler
  const apiHandler = useRef(new APIHandlerInterface({ maxResults: 10 })).current;

  // Query history hook
  const {
    history: dbHistory,
    loading: historyLoading,
    error: historyError,
    addToHistory,
    clearHistory,
    formatTimestamp
  } = useQueryHistory(isAuthenticated);

  // Transform results to graph format
  const graphData = results.length > 0 ? transformPapersToGraph(results) : null;

  // Validate query input (GRAPH-60 enhancement)
  const validateQuery = (queryText) => {
    if (!queryText || !queryText.trim()) {
      return { valid: false, error: 'Please enter a search query' };
    }
    if (queryText.trim().length > 200) {
      return { valid: false, error: 'Query must be less than 200 characters' };
    }
    return { valid: true };
  };

  // Enhanced error handling with retry logic (GRAPH-60 enhancement)
  const handleSubmit = async (e, retry = false) => {
    e.preventDefault();
    
    // Validate query
    const validation = validateQuery(query);
    if (!validation.valid) {
      setError(validation.error);
      queryInputRef.current?.focus();
      return;
    }

    if (!retry) {
      setRetryCount(0);
    }

    setLoading(true);
    setError(null);
    setSelectedNode(null);
    
    try {
      const userId = isAuthenticated && user?.uid ? user.uid : 'demo-user';
      const searchResults = await apiHandler.makeQuery(query.trim(), { 
        type: queryType,
        userId: userId,
        forceRefresh: retry // Force refresh on retry
      });
      
      if (!searchResults || searchResults.length === 0) {
        setError('No papers found. Try different keywords or a broader search term.');
        setResults([]);
      } else {
        setResults(searchResults);
        setRetryCount(0); // Reset retry count on success
        
        // Add to local history for immediate display
        const newHistoryItem = { 
          query: query.trim(), 
          type: queryType,
          timestamp: new Date() 
        };
        setQueryHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]); // Keep last 10
        
        // Add to database history if authenticated
        if (isAuthenticated) {
          try {
            await addToHistory({
              query: query.trim(),
              type: queryType,
              resultCount: searchResults.length
            });
          } catch (historyError) {
            console.warn('Failed to save query history:', historyError);
            // Don't block the user if history save fails
          }
        }
      }
    } catch (err) {
      console.error('Search failed:', err);
      const errorMessage = err.message || 'Failed to search papers. Please try again.';
      setError(errorMessage);
      
      // Auto-retry logic for network errors (GRAPH-60 enhancement)
      if (retryCount < 2 && (err.message?.includes('network') || err.message?.includes('fetch'))) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          handleSubmit(e, true);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (e) => {
    e.preventDefault();
    handleSubmit(e, true);
  };

  const handleSavePaper = async (paper) => {
    try {
      // Mock save functionality - in real implementation this would call the user API
      console.log('Saving paper:', paper.title);
      // TODO: Implement actual save functionality using user API
      alert(`Saved "${paper.title}" to your papers!`);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save paper. Please try again.');
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
    setSelectedNode(null);
  };

  // Handle clicking on a query from history
  const handleHistoryQueryClick = (queryText) => {
    setQuery(queryText);
    // Automatically trigger search
    setTimeout(() => {
      const form = document.querySelector('.search-form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  return (
    <div className="query-page">
      {/* Header */}
      <header className="query-header">
        <div className="query-header-content">
          <h1 className="query-title">Research Graph</h1>
          <p className="query-subtitle">Discover and explore academic papers</p>
          
          <div className="query-nav">
            <Link to="/personal" className="nav-link">
              📚 My Saved Papers
            </Link>
            <Link to="/exploration" className="nav-link">
              🔍 Explore Topics
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="query-main">
        <div className="query-container">
          {/* Search Input - GRAPH-60: Enhanced with query type selector */}
          <div className="search-section">
            <form onSubmit={handleSubmit} className="search-form">
              <div className="search-input-container">
                <input
                  ref={queryInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setError(null); // Clear error when user types
                  }}
                  placeholder="Search for research papers..."
                  className="search-input"
                  disabled={loading || authLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleSubmit(e);
                    }
                  }}
                />
                <select
                  value={queryType}
                  onChange={(e) => setQueryType(e.target.value)}
                  className="query-type-selector"
                  disabled={loading || authLoading}
                  title="Search type"
                >
                  <option value="keyword">Keywords</option>
                  <option value="topic">Topic</option>
                </select>
                <button 
                  type="submit" 
                  className="search-button"
                  disabled={loading || !query.trim() || authLoading}
                  title={queryType === 'keyword' ? 'Search by keywords' : 'Search by topic'}
                >
                  {loading ? '⏳' : '🔍'}
                </button>
              </div>
              {error && retryCount > 0 && (
                <div className="retry-info">
                  <span>Retrying... ({retryCount}/2)</span>
                </div>
              )}
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

          {/* View Mode Toggle */}
          {results.length > 0 && (
            <div className="view-mode-toggle">
              <button
                className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋 List View
              </button>
              <button
                className={`view-mode-btn ${viewMode === 'graph' ? 'active' : ''}`}
                onClick={() => setViewMode('graph')}
              >
                🕸️ Graph View
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Searching for papers...</p>
            </div>
          )}

          {/* Error State - GRAPH-60: Enhanced with retry */}
          {error && (
            <div className="error-state">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
              <div className="error-actions">
                <button onClick={handleRetry} className="retry-button" disabled={loading}>
                  {loading ? 'Retrying...' : 'Retry Search'}
                </button>
                <button onClick={clearResults} className="clear-error-button">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Results Section - List View */}
          {!loading && !error && results.length > 0 && viewMode === 'list' && (
            <div className="results-section">
              <div className="results-header">
                <h2>Search Results ({results.length})</h2>
                <button onClick={clearResults} className="clear-button">
                  Clear Results
                </button>
              </div>
              
              <div className="results-list">
                {results.map((paper, index) => (
                  <div key={paper.id || index} className="result-card">
                    <div className="result-header">
                      <h3 className="result-title">
                        <a 
                          href={paper.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="result-link"
                        >
                          {paper.title}
                        </a>
                      </h3>
                      <button
                        onClick={() => handleSavePaper(paper)}
                        className="save-button"
                        title="Save paper"
                      >
                        💾 Save
                      </button>
                    </div>
                    
                    {paper.authors && paper.authors.length > 0 && (
                      <div className="result-authors">
                        {Array.isArray(paper.authors) 
                          ? paper.authors.join(', ')
                          : paper.authors}
                      </div>
                    )}
                    
                    {paper.summary && (
                      <p className="result-summary">
                        {paper.summary.length > 300 
                          ? paper.summary.slice(0, 300) + '...'
                          : paper.summary
                        }
                      </p>
                    )}
                    
                    <div className="result-footer">
                      <span className="result-date">
                        {paper.published ? new Date(paper.published).getFullYear() : 'Unknown year'}
                      </span>
                      <a 
                        href={paper.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-paper-link"
                      >
                        View Paper →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results Section - Graph View */}
          {!loading && !error && results.length > 0 && viewMode === 'graph' && graphData && (
            <div className="graph-results-section">
              <div className="results-header">
                <h2>Paper Relationship Graph ({results.length} papers)</h2>
                <button onClick={clearResults} className="clear-button">
                  Clear Results
                </button>
              </div>
              <div className="graph-section">
                <GraphVisualization 
                  graphData={graphData} 
                  onNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                  height={600}
                />
              </div>
              {selectedNode && (
                <div className="node-details">
                  <h3>Selected Paper</h3>
                  <p><strong>Title:</strong> {selectedNode.title}</p>
                  <p><strong>Authors:</strong> {selectedNode.authors?.join(', ') || 'Unknown'}</p>
                  {selectedNode.year && <p><strong>Year:</strong> {selectedNode.year}</p>}
                  {selectedNode.citations && <p><strong>Citations:</strong> {selectedNode.citations}</p>}
                  {selectedNode.url && (
                    <p>
                      <a href={selectedNode.url} target="_blank" rel="noopener noreferrer" className="view-paper-link">
                        View Paper →
                      </a>
                    </p>
                  )}
                </div>
              )}
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

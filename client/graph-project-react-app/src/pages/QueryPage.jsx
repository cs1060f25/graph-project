// client/src/pages/QueryPage.jsx
// Main Query Page component with search and graph visualization
// HW9 GRAPH-60: Enhanced Query Input & API Integration

import { useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';
import QueryHistoryPanel from '../components/QueryHistoryPanel';
import { useQueryHistory } from '../hooks/useQueryHistory';
import GraphVisualization from '../components/GraphVisualization';
import { transformPapersToGraph } from '../utils/graphDataTransformer';
import { fetchNextLayer, createLayerLinks } from '../utils/graphLayerHelper';
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

  // Graph layer expansion state
  const [currentDepth, setCurrentDepth] = useState(1); // Current layer depth (1-3)
  const [layerPapers, setLayerPapers] = useState({}); // Papers organized by layer: { 1: [...], 2: [...], 3: [...] }
  const [expandingLayer, setExpandingLayer] = useState(false); // Loading state for expansion
  
  // Layer paper limits: Layer 1 = 10, Layer 2 = 40, Layer 3 = 80
  const LAYER_LIMITS = { 1: 10, 2: 40, 3: 80 };

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

  // Transform results to graph format with layer support
  const graphData = useMemo(() => {
    if (viewMode !== 'graph') return null;
    
    // Combine all papers from all visible layers
    const allVisiblePapers = [];
    for (let layer = 1; layer <= currentDepth; layer++) {
      if (layerPapers[layer] && layerPapers[layer].length > 0) {
        allVisiblePapers.push(...layerPapers[layer]);
      }
    }
    
    // If no layer papers exist yet, use initial results as layer 1
    if (allVisiblePapers.length === 0 && results.length > 0) {
      return transformPapersToGraph(results, 1);
    }
    
    if (allVisiblePapers.length === 0) {
      return null;
    }
    
    // Transform all visible papers to graph format
    const transformed = transformPapersToGraph(allVisiblePapers);
    
    // Start with existing links from transformation
    const allLinks = [...transformed.links];
    
    // Create links between layers (connect new layer papers to their source papers)
    for (let layer = 2; layer <= currentDepth; layer++) {
      if (layerPapers[layer] && layerPapers[layer].length > 0) {
        // Create links from source papers to new layer papers
        const layerLinks = createLayerLinks(layerPapers[layer], transformed.nodes);
        allLinks.push(...layerLinks);
      }
    }
    
    // Deduplicate links (in case some were created in both transform and createLayerLinks)
    const uniqueLinks = [];
    const linkSet = new Set();
    allLinks.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const linkKey = `${sourceId}-${targetId}`;
      if (!linkSet.has(linkKey)) {
        linkSet.add(linkKey);
        uniqueLinks.push(link);
      }
    });
    
    return {
      nodes: transformed.nodes,
      links: uniqueLinks
    };
  }, [results, layerPapers, currentDepth, viewMode]);

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
        // Reset graph layers
        setLayerPapers({});
        setCurrentDepth(1);
      } else {
        setResults(searchResults);
        setRetryCount(0); // Reset retry count on success
        
        // Initialize layer 1 with seed papers (limit to 10)
        const seedPapers = searchResults
          .slice(0, LAYER_LIMITS[1])
          .map(paper => ({
            ...paper,
            layer: 1
          }));
        setLayerPapers({ 1: seedPapers });
        setCurrentDepth(1);
        
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
    // Reset graph layers
    setLayerPapers({});
    setCurrentDepth(1);
  };

  /**
   * Expands the graph to a specific layer
   * Fetches related papers for all papers in previous layers up to the target layer
   */
  const expandToLayer = async (targetLayer) => {
    if (targetLayer < 1 || targetLayer > 3) {
      console.warn('[QueryPage] Invalid target layer:', targetLayer);
      return;
    }

    if (targetLayer <= currentDepth) {
      // Just update the depth to show/hide layers (no fetching needed)
      setCurrentDepth(targetLayer);
      return;
    }

    if (expandingLayer) {
      console.log('[QueryPage] Layer expansion already in progress');
      return;
    }

    setExpandingLayer(true);
    setError(null);

    try {
      // Expand layer by layer until we reach the target
      for (let nextLayer = currentDepth + 1; nextLayer <= targetLayer; nextLayer++) {
        // Check if layer already exists
        if (layerPapers[nextLayer] && layerPapers[nextLayer].length > 0) {
          console.log(`[QueryPage] Layer ${nextLayer} already exists, skipping`);
          continue;
        }

        // Get all papers from previous layers
        const previousLayerPapers = [];
        for (let layer = 1; layer < nextLayer; layer++) {
          if (layerPapers[layer]) {
            previousLayerPapers.push(...layerPapers[layer]);
          }
        }

        if (previousLayerPapers.length === 0) {
          console.warn(`[QueryPage] No papers in previous layers to expand from for layer ${nextLayer}`);
          break;
        }

        // Get all existing papers across all layers
        const allExistingPapers = [];
        for (let layer = 1; layer < nextLayer; layer++) {
          if (layerPapers[layer]) {
            allExistingPapers.push(...layerPapers[layer]);
          }
        }

        console.log(`[QueryPage] Expanding to layer ${nextLayer} from ${previousLayerPapers.length} previous papers`);

        // Calculate how many papers we need for this layer
        // Layer limits are cumulative: Layer 1 = 10 total, Layer 2 = 40 total, Layer 3 = 80 total
        const currentCount = allExistingPapers.length;
        const targetLimit = LAYER_LIMITS[nextLayer];
        const needed = Math.max(0, targetLimit - currentCount);

        if (needed <= 0) {
          console.log(`[QueryPage] Layer ${nextLayer} limit (${targetLimit}) already reached with ${currentCount} papers`);
          setLayerPapers(prev => ({
            ...prev,
            [nextLayer]: []
          }));
          continue;
        }

        console.log(`[QueryPage] Need ${needed} more papers to reach layer ${nextLayer} limit of ${targetLimit}`);

        // Fetch next layer papers (limit per source paper based on how many we need)
        const maxPerPaper = Math.ceil(needed / Math.max(1, previousLayerPapers.length));
        const newPapers = await fetchNextLayer(
          previousLayerPapers,
          allExistingPapers,
          apiHandler,
          Math.max(1, Math.min(maxPerPaper, 5)) // Between 1 and 5 papers per source
        );

        // Limit to exactly what we need to reach the target limit
        const limitedPapers = newPapers.slice(0, needed);

        if (limitedPapers.length === 0) {
          console.log(`[QueryPage] No new papers found for layer ${nextLayer}`);
          setLayerPapers(prev => ({
            ...prev,
            [nextLayer]: []
          }));
          continue;
        }

        // Mark new papers with their layer
        const layerMarkedPapers = limitedPapers.map(paper => ({
          ...paper,
          layer: nextLayer
        }));

        // Update layer papers state
        setLayerPapers(prev => ({
          ...prev,
          [nextLayer]: layerMarkedPapers
        }));

        console.log(`[QueryPage] Successfully expanded to layer ${nextLayer} with ${layerMarkedPapers.length} new papers`);
      }

      // Update depth to target layer
      setCurrentDepth(targetLayer);
    } catch (err) {
      console.error('[QueryPage] Error expanding layer:', err);
      setError(`Failed to expand graph layer: ${err.message}`);
    } finally {
      setExpandingLayer(false);
    }
  };

  /**
   * Handles slider change to expand/collapse layers
   */
  const handleLayerSliderChange = async (e) => {
    const newDepth = parseInt(e.target.value, 10);
    await expandToLayer(newDepth);
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
                <h2>Paper Relationship Graph ({graphData.nodes.length} papers)</h2>
                <div className="graph-controls">
                  {/* Layer Slider Controls */}
                  <div className="layer-controls">
                    <label htmlFor="layer-slider" className="layer-label">
                      Layer: <span className="layer-value">{currentDepth}</span>
                    </label>
                    <input
                      id="layer-slider"
                      type="range"
                      min="1"
                      max="3"
                      value={currentDepth}
                      onChange={handleLayerSliderChange}
                      className="layer-slider"
                      disabled={expandingLayer || loading}
                      title={`Current layer: ${currentDepth}/3`}
                    />
                    <div className="layer-limits">
                      <span className="layer-limit-text">Limits: 10 / 40 / 80</span>
                    </div>
                    {expandingLayer && (
                      <span className="expanding-indicator">⏳ Expanding...</span>
                    )}
                  </div>
                  <button onClick={clearResults} className="clear-button">
                    Clear Results
                  </button>
                </div>
              </div>
              {/* Layer Legend */}
              <div className="layer-legend">
                <div className="legend-title">Layer Colors:</div>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#6366f1' }}></div>
                    <span>Layer 1 (Seed Papers)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#06b6d4', border: '1px dashed #06b6d4' }}></div>
                    <span>Layer 2</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color" style={{ background: '#f97316', border: '1px dashed #f97316' }}></div>
                    <span>Layer 3</span>
                  </div>
                </div>
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

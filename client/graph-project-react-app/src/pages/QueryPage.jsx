// client/src/pages/QueryPage.jsx
// Main Query Page component with search and graph visualization
// HW9 GRAPH-60: Enhanced Query Input & API Integration

import { useState, useRef, useMemo } from 'react';
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';
import QueryHistoryPanel from '../components/QueryHistoryPanel';
import QueryFilterPanel from '../components/QueryFilterPanel';
import { useQueryHistory } from '../hooks/useQueryHistory';
import GraphVisualization from '../components/GraphVisualization';
import { transformPapersToGraph } from '../utils/graphDataTransformer';
import { fetchNextLayer, createLayerLinks } from '../utils/graphLayerHelper';
import { 
  createQueryGraph, 
  mergeQueryGraphs, 
  toggleQueryVisibility, 
  removeQueryGraph
} from '../utils/queryGraphManager';
import { useAuth } from '../contexts/AuthContext';
import './QueryPage.css';
import { userApi } from '../services/userApi';

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState('keyword'); // 'keyword' or 'topic'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'graph'
  const [selectedNode, setSelectedNode] = useState(null);
  const queryInputRef = useRef(null);

  // Multi-query graph state
  const [queryGraphs, setQueryGraphs] = useState([]); // Array of query graph objects

  // Graph layer expansion state (legacy - kept for backward compatibility)
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

  // Transform results to graph format with multi-query support
  const graphData = useMemo(() => {
    if (viewMode !== 'graph') return null;
    
    // If we have query graphs, merge them with layer support
    if (queryGraphs.length > 0) {
      return mergeQueryGraphs(queryGraphs, transformPapersToGraph, createLayerLinks);
    }
    
    // Fallback to legacy layer-based system if no query graphs exist
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
  }, [queryGraphs, results, layerPapers, currentDepth, viewMode]);

  /**
   * Parses multiple queries from input (comma or semicolon separated)
   * @param {string} input - Input string that may contain multiple queries
   * @returns {Array} Array of trimmed query strings
   */
  const parseMultipleQueries = (input) => {
    if (!input || !input.trim()) {
      return [];
    }
    
    // Split by comma or semicolon, then filter out empty strings
    const queries = input
      .split(/[,;]/)
      .map(q => q.trim())
      .filter(q => q.length > 0);
    
    return queries;
  };

  // Validate query input (GRAPH-60 enhancement)
  const validateQuery = (queryText) => {
    if (!queryText || !queryText.trim()) {
      return { valid: false, error: 'Please enter a search query' };
    }
    
    const queries = parseMultipleQueries(queryText);
    if (queries.length === 0) {
      return { valid: false, error: 'Please enter at least one search query' };
    }
    
    // Validate each individual query
    for (const q of queries) {
      if (q.length > 200) {
        return { valid: false, error: `Query "${q.substring(0, 30)}..." is too long (max 200 characters)` };
      }
    }
    
    return { valid: true, queries };
  };

  // Enhanced error handling with retry logic (GRAPH-60 enhancement)
  // Now supports multiple queries separated by commas or semicolons
  const handleSubmit = async (e, retry = false) => {
    e.preventDefault();

    // Validate query and parse multiple queries
    const validation = validateQuery(query);
    if (!validation.valid) {
      setError(validation.error);
      queryInputRef.current?.focus();
      return;
    }

    const queries = validation.queries || [query.trim()];

    if (!retry) {
      setRetryCount(0);
    }

    setLoading(true);
    setError(null);
    setSelectedNode(null);
    
    try {
      const userId = isAuthenticated && user?.uid ? user.uid : 'demo-user';
      const newQueryGraphs = [];
      const allResults = [];
      const errors = [];

      // Process each query
      for (const queryText of queries) {
        try {
          const searchResults = await apiHandler.makeQuery(queryText, { 
            type: queryType,
            userId: userId,
            forceRefresh: retry
          });
          
          if (!searchResults || searchResults.length === 0) {
            errors.push(`No papers found for "${queryText}"`);
            continue;
          }

          // Create a new query graph for this query
          const newQueryGraph = createQueryGraph(
            queryText,
            searchResults.slice(0, LAYER_LIMITS[1]), // Limit to 10 papers for layer 1
            queryGraphs.length + newQueryGraphs.length
          );
          
          newQueryGraphs.push(newQueryGraph);
          allResults.push(...searchResults);
          
          // Add to database history if authenticated
          if (isAuthenticated) {
            try {
              await addToHistory({
                query: queryText,
                type: queryType,
                resultCount: searchResults.length
              });
            } catch (historyError) {
              console.warn(`Failed to save query history for "${queryText}":`, historyError);
            }
          }
        } catch (err) {
          console.error(`Search failed for "${queryText}":`, err);
          errors.push(`Failed to search "${queryText}": ${err.message || 'Unknown error'}`);
        }
      }

      // Update state with all new query graphs
      if (newQueryGraphs.length > 0) {
        setQueryGraphs(prev => [...prev, ...newQueryGraphs]);
        setResults(allResults);
        setRetryCount(0);

        // Legacy layer system (for backward compatibility) - use first query's results
        if (allResults.length > 0) {
          const seedPapers = allResults
            .slice(0, LAYER_LIMITS[1])
            .map(paper => ({
              ...paper,
              layer: 1
            }));
          setLayerPapers({ 1: seedPapers });
          setCurrentDepth(1);
        }

        // Show success message or partial errors
        if (errors.length > 0 && errors.length < queries.length) {
          setError(`Some queries failed: ${errors.join('; ')}`);
        } else if (errors.length === queries.length) {
          setError(`All queries failed: ${errors.join('; ')}`);
          setResults([]);
          setLayerPapers({});
          setCurrentDepth(1);
        } else {
          setError(null);
        }
      } else {
        // All queries failed
        const errorMessage = errors.length > 0 
          ? errors.join('; ')
          : 'No papers found. Try different keywords or a broader search term.';
        setError(errorMessage);
        setResults([]);
        setLayerPapers({});
        setCurrentDepth(1);
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
      // Check if user is authenticated
      if (!isAuthenticated) {
        alert('Please log in to save papers.');
        return;
      }

      // Map paper fields to backend format
      // Backend expects: title, authors, link (required), abstract, publishedDate (optional)
      // QueryPage papers have: title, authors, link, summary, published
      // Graph nodes might have: title, authors, url, summary, year
      const paperData = {
        title: paper.title,
        authors: Array.isArray(paper.authors) 
          ? paper.authors 
          : (paper.authors ? [paper.authors] : []),
        link: paper.link || paper.url || '',
        abstract: paper.summary || paper.abstract || '',
        publishedDate: paper.published || paper.publishedDate || (paper.year ? `${paper.year}-01-01` : null),
      };

      // Validate required fields
      if (!paperData.title || !paperData.link || !paperData.authors || paperData.authors.length === 0) {
        alert('Cannot save paper: missing required fields (title, authors, or link).');
        return;
      }

      console.log('Saving paper:', paperData.title);
      const result = await userApi.savePaper(paperData);
      
      if (result.success) {
        alert(`Saved "${paper.title}" to your papers!`);
      } else {
        alert(`Failed to save "${paper.title}": ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert(`Failed to save paper: ${err.message || 'Please try again.'}`);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
    setSelectedNode(null);
    // Clear all query graphs
    setQueryGraphs([]);
    // Reset graph layers
    setLayerPapers({});
    setCurrentDepth(1);
  };

  /**
   * Handles toggling visibility of a query graph
   */
  const handleToggleQueryVisibility = (queryId) => {
    setQueryGraphs(prev => toggleQueryVisibility(prev, queryId));
  };

  /**
   * Handles removing a query graph
   */
  const handleRemoveQuery = (queryId) => {
    setQueryGraphs(prev => removeQueryGraph(prev, queryId));
    // If this was the last query, clear results
    if (queryGraphs.length === 1) {
      setResults([]);
      setLayerPapers({});
      setCurrentDepth(1);
    }
  };

  /**
   * Expands the graph to a specific layer for all visible query graphs
   * Fetches related papers for all papers in previous layers up to the target layer
   */
  const expandToLayer = async (targetLayer) => {
    if (targetLayer < 1 || targetLayer > 3) {
      console.warn('[QueryPage] Invalid target layer:', targetLayer);
      return;
    }

    if (expandingLayer) {
      console.log('[QueryPage] Layer expansion already in progress');
      return;
    }

    setExpandingLayer(true);
    setError(null);

    try {
      // If we have query graphs, expand layers for each visible query
      if (queryGraphs.length > 0) {
        const updatedQueryGraphs = await Promise.all(
          queryGraphs.map(async (queryGraph) => {
            if (!queryGraph.visible) {
              // Just update depth for hidden queries without fetching
              return {
                ...queryGraph,
                currentDepth: Math.min(targetLayer, queryGraph.currentDepth || 1)
              };
            }

            const currentQueryDepth = queryGraph.currentDepth || 1;
            
            // If target is less than current depth, just update (no fetching)
            if (targetLayer <= currentQueryDepth) {
              return {
                ...queryGraph,
                currentDepth: targetLayer
              };
            }

            // Expand layer by layer until we reach the target
            let updatedLayerPapers = { ...queryGraph.layerPapers };
            let nextDepth = currentQueryDepth;

            for (let nextLayer = currentQueryDepth + 1; nextLayer <= targetLayer; nextLayer++) {
              // Check if layer already exists
              if (updatedLayerPapers[nextLayer] && updatedLayerPapers[nextLayer].length > 0) {
                console.log(`[QueryPage] Query ${queryGraph.id} layer ${nextLayer} already exists, skipping`);
                nextDepth = nextLayer;
                continue;
              }

              // Get all papers from previous layers for this query
              const previousLayerPapers = [];
              for (let layer = 1; layer < nextLayer; layer++) {
                if (updatedLayerPapers[layer]) {
                  previousLayerPapers.push(...updatedLayerPapers[layer]);
                }
              }

              if (previousLayerPapers.length === 0) {
                console.warn(`[QueryPage] No papers in previous layers for query ${queryGraph.id}`);
                break;
              }

              // Get all existing papers across all layers for this query
              const allExistingPapers = [];
              for (let layer = 1; layer < nextLayer; layer++) {
                if (updatedLayerPapers[layer]) {
                  allExistingPapers.push(...updatedLayerPapers[layer]);
                }
              }

              // Calculate how many papers we need for this layer
              const currentCount = allExistingPapers.length;
              const targetLimit = LAYER_LIMITS[nextLayer];
              const needed = Math.max(0, targetLimit - currentCount);

              if (needed <= 0) {
                console.log(`[QueryPage] Query ${queryGraph.id} layer ${nextLayer} limit already reached`);
                updatedLayerPapers[nextLayer] = [];
                nextDepth = nextLayer;
                continue;
              }

              // Fetch next layer papers
              const maxPerPaper = Math.ceil(needed / Math.max(1, previousLayerPapers.length));
              const newPapers = await fetchNextLayer(
                previousLayerPapers,
                allExistingPapers,
                apiHandler,
                Math.max(1, Math.min(maxPerPaper, 5))
              );

              // Limit to exactly what we need
              const limitedPapers = newPapers.slice(0, needed);

              if (limitedPapers.length === 0) {
                console.log(`[QueryPage] No new papers found for query ${queryGraph.id} layer ${nextLayer}`);
                updatedLayerPapers[nextLayer] = [];
                nextDepth = nextLayer;
                continue;
              }

              // Mark new papers with their layer
              const layerMarkedPapers = limitedPapers.map(paper => ({
                ...paper,
                layer: nextLayer
              }));

              updatedLayerPapers[nextLayer] = layerMarkedPapers;
              nextDepth = nextLayer;

              console.log(`[QueryPage] Query ${queryGraph.id} expanded to layer ${nextLayer} with ${layerMarkedPapers.length} papers`);
            }

            return {
              ...queryGraph,
              layerPapers: updatedLayerPapers,
              currentDepth: nextDepth
            };
          })
        );

        setQueryGraphs(updatedQueryGraphs);
      } else {
        // Legacy single-query layer expansion (for backward compatibility)
        if (targetLayer <= currentDepth) {
          setCurrentDepth(targetLayer);
          setExpandingLayer(false);
          return;
        }

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

          // Fetch next layer papers
          const maxPerPaper = Math.ceil(needed / Math.max(1, previousLayerPapers.length));
          const newPapers = await fetchNextLayer(
            previousLayerPapers,
            allExistingPapers,
            apiHandler,
            Math.max(1, Math.min(maxPerPaper, 5))
          );

          // Limit to exactly what we need
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
      }
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
                  placeholder="Search for research papers... (separate multiple queries with commas or semicolons)"
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
                <button 
                  type="submit" 
                  className="search-button"
                  disabled={false}
                  onClick={(e) => {
                    setQuery("machine learning");
                    // wait until React updates query, then submit
                    setTimeout(() => handleSubmit(e), 0);
                  }}
                  title={'Im feeling lucky'}
                >
                  {loading ? '⏳' : '🎲'}
                </button>
              </div>
              {error && retryCount > 0 && (
                <div className="retry-info">
                  <span>Retrying... ({retryCount}/2)</span>
                </div>
              )}
            </form>
          </div>

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
          {!loading && !error && (results.length > 0 || queryGraphs.length > 0) && viewMode === 'graph' && graphData && (
            <div className="graph-results-section">
              {/* Query Filter Panel */}
              {queryGraphs.length > 0 && (
                <QueryFilterPanel
                  queryGraphs={queryGraphs}
                  onToggleVisibility={handleToggleQueryVisibility}
                  onRemoveQuery={handleRemoveQuery}
                />
              )}
              
              <div className="results-header">
                <h2>Paper Relationship Graph ({graphData.nodes.length} papers)</h2>
                <div className="graph-controls">
                  {/* Layer Slider Controls */}
                  <div className="layer-controls">
                    <label htmlFor="layer-slider" className="layer-label">
                      Layer: <span className="layer-value">
                        {queryGraphs.length > 0 
                          ? Math.max(...queryGraphs.map(qg => qg.currentDepth || 1))
                          : currentDepth
                        }
                      </span>
                    </label>
                    <input
                      id="layer-slider"
                      type="range"
                      min="1"
                      max="3"
                      value={queryGraphs.length > 0 
                        ? Math.max(...queryGraphs.map(qg => qg.currentDepth || 1))
                        : currentDepth
                      }
                      onChange={handleLayerSliderChange}
                      className="layer-slider"
                      disabled={expandingLayer || loading}
                      title={`Current layer: ${queryGraphs.length > 0 
                        ? Math.max(...queryGraphs.map(qg => qg.currentDepth || 1))
                        : currentDepth
                      }/3`}
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
                <div className="legend-title">Visual Guide:</div>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-color-group">
                      <div className="legend-color" style={{ background: '#3a82ff', opacity: 1.0 }}></div>
                      <div className="legend-color" style={{ background: '#3a82ff', opacity: 0.75 }}></div>
                      <div className="legend-color" style={{ background: '#3a82ff', opacity: 0.5 }}></div>
                    </div>
                    <span>Layer Depth → Opacity (1.0 / 0.75 / 0.5)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-note">
                      <span>Each query has a unique color. Opacity indicates layer depth.</span>
                    </div>
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
                  <button
                    onClick={() => handleSavePaper(selectedNode)}
                    className="save-button"
                    title="Save paper"
                  >
                    💾 Save Paper
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && queryGraphs.length === 0 && (
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

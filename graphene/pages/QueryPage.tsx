// import './QueryPage.css';
// client/src/pages/QueryPage.jsx
// Main Query Page component with search and graph visualization
// HW9 GRAPH-60: Enhanced Query Input & API Integration

'use client';

import { useState, useRef, useMemo } from 'react';
import Icon from '../components/Icon';
import QueryHistoryPanel from '../components/QueryHistoryPanel';
import QueryFilterPanel from '../components/QueryFilterPanel';
import { useQueryHistory } from '../lib/hooks/useQueryHistory';
import GraphVisualization from '../components/GraphVisualization';
import { transformPapersToGraph, type GraphNode, type GraphLink } from '../lib/utils/graphDataTransformer';
import { fetchNextLayer, createLayerLinks } from '../lib/utils/graphLayerHelper';
import { 
  createQueryGraph, 
  mergeQueryGraphs, 
  toggleQueryVisibility, 
  removeQueryGraph
} from '../lib/utils/queryGraphManager';
import { useAuth } from '../lib/contexts/AuthContext';
import { userApi } from '../lib/services/userApi';
import { Paper } from '../lib/models/types';
import PaperSummary from '../components/PaperSummary';
import '../styles/QueryPage.css';

interface QueryGraph {
  id: string;
  label: string;
  fullLabel: string;
  color: string;
  visible: boolean;
  papers: any[]; // Flexible Paper type to match queryGraphManager
  layerPapers: { [key: number]: any[] };
  currentDepth: number;
  createdAt: string;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export default function QueryPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [queryType, setQueryType] = useState<'keyword' | 'topic'>('keyword');
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);

  // Multi-query graph state
  const [queryGraphs, setQueryGraphs] = useState<QueryGraph[]>([]);

  // Graph layer expansion state (legacy - kept for backward compatibility)
  const [currentDepth, setCurrentDepth] = useState<number>(1);
  const [layerPapers, setLayerPapers] = useState<{ [key: number]: Paper[] }>({});
  const [expandingLayer, setExpandingLayer] = useState<boolean>(false);
  
  // Layer paper limits: Layer 1 = 10, Layer 2 = 40, Layer 3 = 80
  const LAYER_LIMITS: { [key: number]: number } = { 1: 10, 2: 40, 3: 80 };

  // Use actual authentication context (GRAPH-60 enhancement)
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = !!user;

  const searchPapers = async (query: string, options: { type: 'keyword' | 'topic', userId?: string, forceRefresh?: boolean }) => {
    const response = await fetch('/api/papers/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, type: options.type, maxResults: 10, userId: options.userId, forceRefresh: options.forceRefresh }),
    });
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.papers || [];
  };

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
  // GRAPH-61: Graph is now the default and only view mode
  const graphData = useMemo((): GraphData | null => {
      // If we have query graphs, merge them with layer support
    if (queryGraphs.length > 0) {
      return mergeQueryGraphs(queryGraphs, transformPapersToGraph, createLayerLinks as any);
    }
    
    // Fallback to legacy layer-based system if no query graphs exist
    // Combine all papers from all visible layers
    const allVisiblePapers: Paper[] = [];
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
        const layerLinks = createLayerLinks(layerPapers[layer] as any, transformed.nodes);
        allLinks.push(...(layerLinks as GraphLink[]));
      }
    }
    
    // Deduplicate links (in case some were created in both transform and createLayerLinks)
    const uniqueLinks: GraphLink[] = [];
    const linkSet = new Set<string>();
    allLinks.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const linkKey = `${sourceId}-${targetId}`;
      if (!linkSet.has(linkKey)) {
        linkSet.add(linkKey);
        uniqueLinks.push(link as GraphLink);
      }
    });
    
    return {
      nodes: transformed.nodes,
      links: uniqueLinks
    };
  }, [queryGraphs, results, layerPapers, currentDepth]);

  /**
   * Parses multiple queries from input (comma or semicolon separated)
   */
  const parseMultipleQueries = (input: string): string[] => {
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
  const validateQuery = (queryText: string): { valid: boolean; error?: string | null; queries?: string[] } => {
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
  const handleSubmit = async (e: React.FormEvent | any, retry: boolean = false, initialQueries: string | string[] | null = null) => {
    // preventDefault if an event-like object was passed
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // Determine which queries to run: optional override (string or array) or current state
    let queries = null;
    if (initialQueries) {
      if (typeof initialQueries === 'string') {
        const validation = validateQuery(initialQueries);
        if (!validation.valid) {
          setError(validation.error || null);
          queryInputRef.current?.focus();
          return;
        }
        queries = validation.queries || [initialQueries.trim()];
      } else if (Array.isArray(initialQueries)) {
        queries = initialQueries;
      }
    } else {
      // Validate query and parse multiple queries from input state
      const validation = validateQuery(query);
      if (!validation.valid) {
        setError(validation.error || null);
        queryInputRef.current?.focus();
        return;
      }

      queries = validation.queries || [query.trim()];
    }
    
    if (!queries) {
      setError('Invalid query');
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
      const newQueryGraphs: QueryGraph[] = [];
      const allResults: Paper[] = [];
      const errors: string[] = [];

      // Process each query
      for (const queryText of queries as string[]) {
        try {
          const searchResults = await searchPapers(queryText, { 
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
          ) as QueryGraph;
          
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
            } catch (historyError: unknown) {
              console.warn(`Failed to save query history for "${queryText}":`, historyError);
            }
          }
        } catch (err: any) {
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
    } catch (err: any) {
      console.error('Search failed:', err);
      const errorMessage = (err as Error)?.message || 'Failed to search papers. Please try again.';
      setError(errorMessage);
      
      // Auto-retry logic for network errors (GRAPH-60 enhancement)
      const errMessage = (err as Error)?.message || '';
      if (retryCount < 2 && (errMessage.includes('network') || errMessage.includes('fetch'))) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          handleSubmit(e, true);
        }, 1000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit(e, true);
  };

  const handleSavePaper = async (paper: any) => {
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
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(`Failed to save paper: ${err?.message || 'Please try again.'}`);
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
  const handleToggleQueryVisibility = (queryId: string) => {
    setQueryGraphs(prev => toggleQueryVisibility(prev as any, queryId) as QueryGraph[]);
  };

  /**
   * Handles removing a query graph
   */
  const handleRemoveQuery = (queryId: string) => {
    setQueryGraphs(prev => removeQueryGraph(prev as any, queryId) as QueryGraph[]);
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
  const expandToLayer = async (targetLayer: number) => {
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
              const previousLayerPapers: Paper[] = [];
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
              const allExistingPapers: Paper[] = [];
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
                searchPapers,
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
          const previousLayerPapers: Paper[] = [];
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
          const allExistingPapers: Paper[] = [];
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
            searchPapers,
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
    } catch (err: any) {
      console.error('[QueryPage] Error expanding layer:', err);
      setError(`Failed to expand graph layer: ${err.message}`);
    } finally {
      setExpandingLayer(false);
    }
  };

  /**
   * Handles slider change to expand/collapse layers
   */
  const handleLayerSliderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDepth = parseInt(e.target.value, 10);
    await expandToLayer(newDepth);
  };

  // Handle clicking on a query from history
  const handleHistoryQueryClick = (queryText: string) => {
    setQuery(queryText);
    // Automatically trigger search
    setTimeout(() => {
      const form = document.querySelector('.search-form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
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
                  onChange={(e) => setQueryType(e.target.value as 'keyword' | 'topic')}
                  className="query-type-selector"
                  disabled={loading || authLoading}
                  title="Search type"
                >
                  <option value="keyword">Keywords</option>
                  <option value="topic">Topic</option>
                </select>
                  <div className="search-actions">
                                    <button 
                    type="submit" 
                    className="search-button"
                    disabled={loading || !query.trim() || authLoading}
                    title={queryType === 'keyword' ? 'Search by keywords' : 'Search by topic'}
                  >
                    {loading ? '⏳' : '🔍'}
                  </button>
                  <button
                    type="button"
                    className="search-button"
                    disabled={false}
                    onClick={(e) => {
                      // Submit a preset query immediately without waiting for state update
                      handleSubmit(e, false, 'machine learning');
                      // also update the input so the user sees the selected query
                      setQuery('machine learning');
                    }}
                    title={"I'm feeling lucky"}
                  >
                    {loading ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="dice" ariaLabel="I'm feeling lucky" />}
                  </button>
                  <button
                    type="button"
                    className={`history-button ${isHistoryOpen ? 'active' : ''}`}
                    onClick={toggleHistory}
                    title="View search history"
                  >
                    <Icon name="book" ariaLabel="History" />
                  </button>
                </div>

              </div>
              {error && retryCount > 0 && (
                <div className="retry-info">
                  <span>Retrying... ({retryCount}/2)</span>
                </div>
              )}
            </form>
          </div>

          {/* History panel as modal */}
          <QueryHistoryPanel
            history={dbHistory}
            loading={historyLoading}
            error={historyError}
            isAuthenticated={isAuthenticated}
            onQueryClick={handleHistoryQueryClick}
            onClearHistory={clearHistory}
            formatTimestamp={formatTimestamp}
            isOpen={isHistoryOpen}
            onToggle={toggleHistory}
          />

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
              <div className="error-icon"><Icon name="warning" ariaLabel="Error" /></div>
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

          {/* Results Section - Graph View */}
          {/* GRAPH-61: Graph visualization replaces row/list display */}
          {!loading && !error && (results.length > 0 || queryGraphs.length > 0) && graphData && (
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
                      <span className="expanding-indicator"><Icon name="hourglass" ariaLabel="Expanding" /> <span style={{ marginLeft: 6 }}>Expanding...</span></span>
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
                  graphData={graphData as any} 
                  onNodeClick={handleNodeClick as any}
                  selectedNode={selectedNode as any}
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
                  <PaperSummary 
                    paperId={selectedNode.id} 
                    paper={(() => {
                      // Find original paper data from results or queryGraphs
                      const allPapers = [
                        ...results,
                        ...queryGraphs.flatMap(qg => qg.papers || []),
                        ...Object.values(layerPapers).flat()
                      ];
                      const originalPaper = allPapers.find(p => 
                        p.id === selectedNode.id || 
                        p.paperId === selectedNode.id ||
                        (p.doi && selectedNode.id.includes(p.doi))
                      );
                      
                      return {
                        id: selectedNode.id,
                        title: selectedNode.title || '',
                        authors: selectedNode.authors || [],
                        link: selectedNode.url || originalPaper?.link || '',
                        summary: originalPaper?.summary || originalPaper?.abstract,
                        abstract: originalPaper?.abstract || originalPaper?.summary,
                      };
                    })()}
                  />
                  <button
                    onClick={() => handleSavePaper(selectedNode)}
                    className="save-button"
                    title="Save paper"
                  >
                    <Icon name="save" ariaLabel="Save paper" />
                    <span style={{ marginLeft: 8 }}>Save Paper</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && results.length === 0 && queryGraphs.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon"><Icon name="search" ariaLabel="Start searching" /></div>
              <h3>Start Your Research Journey</h3>
              <p>Enter a research question or keywords to discover relevant academic papers.</p>
              <div className="example-queries">
                <p className="empty-try">Try searching for:</p>
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

'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../../components/Icon';
import QueryHistoryPanel from '../../components/QueryHistoryPanel';
import QueryFilterPanel from '../../components/QueryFilterPanel';
import GraphVisualization from '../../components/GraphVisualization';
import { useAuth } from '../../contexts/AuthContext';
import { queryPapers, type QueryType, type Paper as QueryPaper } from '../../lib/api/query';
import { getQueryHistory, addQueryHistory, clearQueryHistory, type QueryHistoryItem } from '../../lib/api/user';
import { savePaper } from '../../lib/api/user';
import { parseMultipleQueries, validateQuery, formatQueryTimestamp } from '../../lib/utils/query';
import { transformPapersToGraph, type GraphData, type Paper } from '../../lib/utils/graph';

interface QueryGraph {
  id: string;
  label: string;
  fullLabel: string;
  color: string;
  visible: boolean;
  papers: Paper[];
  layerPapers: Record<number, Paper[]>;
  currentDepth: number;
  createdAt: string;
}

const QUERY_COLOR_PALETTE = [
  '#3a82ff', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
  '#06b6d4', '#f97316', '#84cc16', '#6366f1', '#14b8a6',
];

const LAYER_LIMITS: Record<number, number> = { 1: 10, 2: 40, 3: 80 };

function createQueryGraph(queryText: string, papers: Paper[], index: number): QueryGraph {
  const color = QUERY_COLOR_PALETTE[index % QUERY_COLOR_PALETTE.length];
  const id = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    label: queryText.length > 30 ? queryText.substring(0, 30) + '...' : queryText,
    fullLabel: queryText,
    color,
    visible: true,
    papers: papers || [],
    layerPapers: { 1: papers || [] },
    currentDepth: 1,
    createdAt: new Date().toISOString(),
  };
}

function toggleQueryVisibility(queryGraphs: QueryGraph[], queryId: string): QueryGraph[] {
  return queryGraphs.map(qg => 
    qg.id === queryId ? { ...qg, visible: !qg.visible } : qg
  );
}

function removeQueryGraph(queryGraphs: QueryGraph[], queryId: string): QueryGraph[] {
  return queryGraphs.filter(qg => qg.id !== queryId);
}

function mergeQueryGraphs(queryGraphs: QueryGraph[]): GraphData {
  if (!queryGraphs || queryGraphs.length === 0) {
    return { nodes: [], links: [] };
  }

  const visibleQueries = queryGraphs.filter(qg => qg.visible);
  
  if (visibleQueries.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodeMap = new Map<string, any>();
  const nodeQueryMap = new Map<string, Set<string>>();
  const allLinks: any[] = [];

  visibleQueries.forEach(queryGraph => {
    const { id: queryId, layerPapers, currentDepth, color } = queryGraph;
    
    const allVisiblePapers: Paper[] = [];
    for (let layer = 1; layer <= (currentDepth || 1); layer++) {
      if (layerPapers && layerPapers[layer] && layerPapers[layer].length > 0) {
        allVisiblePapers.push(...layerPapers[layer]);
      }
    }
    
    if (allVisiblePapers.length === 0) return;

    const graphData = transformPapersToGraph(allVisiblePapers, 1);
    
    graphData.nodes.forEach(node => {
      const nodeId = node.id;
      
      if (nodeMap.has(nodeId)) {
        const existingNode = nodeMap.get(nodeId);
        if (!nodeQueryMap.has(nodeId)) {
          nodeQueryMap.set(nodeId, new Set());
        }
        nodeQueryMap.get(nodeId)!.add(queryId);
        
        existingNode.queryIds = Array.from(nodeQueryMap.get(nodeId)!);
        existingNode.queryColors = existingNode.queryColors || [];
        if (!existingNode.queryColors.includes(color)) {
          existingNode.queryColors.push(color);
        }
      } else {
        const newNode = {
          ...node,
          queryId,
          queryIds: [queryId],
          queryColors: [color],
          primaryColor: color,
        };
        nodeMap.set(nodeId, newNode);
        nodeQueryMap.set(nodeId, new Set([queryId]));
      }
    });

    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
        allLinks.push({
          ...link,
          source: sourceId,
          target: targetId,
          queryId,
          color,
        });
      }
    });
  });

  const nodes = Array.from(nodeMap.values());

  const linkMap = new Map<string, any>();
  allLinks.forEach(link => {
    const key = `${link.source}-${link.target}`;
    if (!linkMap.has(key)) {
      linkMap.set(key, link);
    } else {
      const existing = linkMap.get(key);
      if (!existing.queryIds) {
        existing.queryIds = [existing.queryId];
        existing.queryColors = [existing.color];
      }
      if (!existing.queryIds.includes(link.queryId)) {
        existing.queryIds.push(link.queryId);
        existing.queryColors.push(link.queryColors || link.color);
      }
    }
  });

  const links = Array.from(linkMap.values());

  return { nodes, links };
}

async function executeQuery(
  queryText: string,
  queryType: QueryType,
  token: string | null
): Promise<QueryPaper[]> {
  return queryPapers(queryText, queryType, token || undefined);
}

async function handleQueryResults(
  results: QueryPaper[],
  queryText: string,
  queryType: QueryType,
  queryGraphs: QueryGraph[],
  token: string | null,
  addToHistory: (item: { query: string; type: string; resultCount: number }) => Promise<void>
): Promise<QueryGraph> {
  if (!results || results.length === 0) {
    throw new Error(`No papers found for "${queryText}"`);
  }

  const papers: Paper[] = results.map(paper => ({
    id: paper.id,
    title: paper.title,
    authors: paper.authors,
    link: paper.link,
    url: paper.link,
    summary: paper.summary,
    published: paper.published,
    year: paper.year,
    citations: paper.citations,
    layer: 1,
  }));

  const newQueryGraph = createQueryGraph(
    queryText,
    papers.slice(0, LAYER_LIMITS[1]),
    queryGraphs.length
  );

  if (token) {
    try {
      await addToHistory({
        query: queryText,
        type: queryType,
        resultCount: results.length,
      });
    } catch (historyError) {
      console.warn(`Failed to save query history for "${queryText}":`, historyError);
    }
  }

  return newQueryGraph;
}

export default function QueryPage() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('keyword');
  const [results, setResults] = useState<QueryPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const queryInputRef = useRef<HTMLInputElement>(null);
  const [queryGraphs, setQueryGraphs] = useState<QueryGraph[]>([]);
  const [currentDepth, setCurrentDepth] = useState(1);
  const [layerPapers, setLayerPapers] = useState<Record<number, Paper[]>>({});
  const [expandingLayer, setExpandingLayer] = useState(false);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (isAuthenticated && token) {
      loadHistory();
    }
  }, [isAuthenticated, token]);

  async function loadHistory() {
    if (!token) return;
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const historyData = await getQueryHistory(token, 20);
      setHistory(historyData || []);
    } catch (err: any) {
      console.error('Error fetching query history:', err);
      setHistoryError(err.message || 'Failed to load query history');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function addToHistory(item: { query: string; type: string; resultCount: number }) {
    if (!token) return;
    try {
      const newQuery = await addQueryHistory(token, item);
      setHistory(prev => [newQuery, ...prev]);
    } catch (err) {
      console.error('Error adding to query history:', err);
    }
  }

  async function clearHistory() {
    if (!token) return;
    try {
      await clearQueryHistory(token);
      setHistory([]);
    } catch (err: any) {
      console.error('Error clearing query history:', err);
      setHistoryError('Failed to clear query history');
    }
  }

  const graphData = useMemo(() => {
    if (queryGraphs.length > 0) {
      return mergeQueryGraphs(queryGraphs);
    }
    
    const allVisiblePapers: Paper[] = [];
    for (let layer = 1; layer <= currentDepth; layer++) {
      if (layerPapers[layer] && layerPapers[layer].length > 0) {
        allVisiblePapers.push(...layerPapers[layer]);
      }
    }
    
    if (allVisiblePapers.length === 0 && results.length > 0) {
      return transformPapersToGraph(results as Paper[], 1);
    }
    
    if (allVisiblePapers.length === 0) {
      return null;
    }
    
    const transformed = transformPapersToGraph(allVisiblePapers);
    const allLinks = [...transformed.links];
    
    for (let layer = 2; layer <= currentDepth; layer++) {
      if (layerPapers[layer] && layerPapers[layer].length > 0) {
        const layerLinks = layerPapers[layer].map(paper => ({
          source: paper.id,
          target: paper.id,
          value: 1,
        }));
        allLinks.push(...layerLinks);
      }
    }
    
    const linkSet = new Set<string>();
    const uniqueLinks = allLinks.filter(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const linkKey = `${sourceId}-${targetId}`;
      if (!linkSet.has(linkKey)) {
        linkSet.add(linkKey);
        return true;
      }
      return false;
    });
    
    return {
      nodes: transformed.nodes,
      links: uniqueLinks
    };
  }, [queryGraphs, results, layerPapers, currentDepth]);

  const handleSubmit = async (e?: React.FormEvent, retry = false, initialQueries: string | string[] | null = null) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    let queries: string[] = [];
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
      const validation = validateQuery(query);
      if (!validation.valid) {
        setError(validation.error || null);
        queryInputRef.current?.focus();
        return;
      }
      queries = validation.queries || [query.trim()];
    }

    if (!retry) {
      setRetryCount(0);
    }

    setLoading(true);
    setError(null);
    setSelectedNode(null);
    
    try {
      const newQueryGraphs: QueryGraph[] = [];
      const allResults: QueryPaper[] = [];
      const errors: string[] = [];

      for (const queryText of queries) {
        try {
          const searchResults = await executeQuery(queryText, queryType, token);
          
          if (!searchResults || searchResults.length === 0) {
            errors.push(`No papers found for "${queryText}"`);
            continue;
          }

          const newQueryGraph = await handleQueryResults(
            searchResults,
            queryText,
            queryType,
            queryGraphs,
            token,
            addToHistory
          );
          
          newQueryGraphs.push(newQueryGraph);
          allResults.push(...searchResults);
        } catch (err: any) {
          console.error(`Search failed for "${queryText}":`, err);
          errors.push(`Failed to search "${queryText}": ${err.message || 'Unknown error'}`);
        }
      }

      if (newQueryGraphs.length > 0) {
        setQueryGraphs(prev => [...prev, ...newQueryGraphs]);
        setResults(allResults);
        setRetryCount(0);

        if (allResults.length > 0) {
          const seedPapers = allResults
            .slice(0, LAYER_LIMITS[1])
            .map(paper => ({
              ...paper,
              layer: 1
            } as Paper));
          setLayerPapers({ 1: seedPapers });
          setCurrentDepth(1);
        }

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
      const errorMessage = err.message || 'Failed to search papers. Please try again.';
      setError(errorMessage);
      
      if (retryCount < 2 && (err.message?.includes('network') || err.message?.includes('fetch'))) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          handleSubmit(undefined, true);
        }, 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSubmit(undefined, true);
  };

  const handleSavePaper = async (paper: any) => {
    if (!isAuthenticated || !token) {
      alert('Please log in to save papers.');
      return;
    }

    const paperData = {
      title: paper.title,
      authors: Array.isArray(paper.authors) 
        ? paper.authors 
        : (paper.authors ? [paper.authors] : []),
      link: paper.link || paper.url || '',
      abstract: paper.summary || paper.abstract || '',
      publishedDate: paper.published || paper.publishedDate || (paper.year ? `${paper.year}-01-01` : null),
    };

    if (!paperData.title || !paperData.link || !paperData.authors || paperData.authors.length === 0) {
      alert('Cannot save paper: missing required fields (title, authors, or link).');
      return;
    }

    try {
      await savePaper(token, paperData);
      alert(`Saved "${paper.title}" to your papers!`);
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(`Failed to save paper: ${err.message || 'Please try again.'}`);
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
    setSelectedNode(null);
    setQueryGraphs([]);
    setLayerPapers({});
    setCurrentDepth(1);
  };

  const handleToggleQueryVisibility = (queryId: string) => {
    setQueryGraphs(prev => toggleQueryVisibility(prev, queryId));
  };

  const handleRemoveQuery = (queryId: string) => {
    setQueryGraphs(prev => removeQueryGraph(prev, queryId));
    if (queryGraphs.length === 1) {
      setResults([]);
      setLayerPapers({});
      setCurrentDepth(1);
    }
  };

  const handleHistoryQueryClick = (queryText: string) => {
    setQuery(queryText);
    setTimeout(() => {
      const form = document.querySelector('.search-form') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  const handleNodeClick = (node: any) => {
    setSelectedNode(node);
  };

  const toggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] text-[#eaeaea] font-sans">
      <main className="flex-1 py-8">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="mb-8">
            <form onSubmit={(e) => handleSubmit(e)} className="w-full search-form">
              <div className="relative flex items-center gap-2 bg-[#151517] border-2 border-[#2a2a2e] rounded-xl px-4 py-3 transition-all focus-within:border-[#3a82ff] focus-within:shadow-[0_0_0_3px_rgba(58,130,255,0.1)]">
                <input
                  ref={queryInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setError(null);
                  }}
                  placeholder="Search for research papers... (separate multiple queries with commas or semicolons)"
                  className="flex-1 border-none outline-none text-base text-white bg-transparent placeholder:text-[#6b7280]"
                  disabled={loading || authLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleSubmit(e);
                    }
                  }}
                />
                <select
                  value={queryType}
                  onChange={(e) => setQueryType(e.target.value as QueryType)}
                  className="bg-[#1a1a1c] border border-[#2a2a2e] rounded-lg px-3 py-2 text-sm text-[#c9c9ce] cursor-pointer transition-all outline-none hover:bg-[#2a2a2e] hover:border-[#3a3a3e] focus:border-[#3a82ff] focus:shadow-[0_0_0_2px_rgba(58,130,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading || authLoading}
                  title="Search type"
                >
                  <option value="keyword">Keywords</option>
                  <option value="topic">Topic</option>
                </select>
                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    className="bg-[#3a82ff] text-white border-none rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-all hover:bg-[#2563eb] disabled:bg-[#4a4a4e] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={loading || !query.trim() || authLoading}
                    title={queryType === 'keyword' ? 'Search by keywords' : 'Search by topic'}
                  >
                    {loading ? '⏳' : '🔍'}
                  </button>
                  <button
                    type="button"
                    className="bg-[#3a82ff] text-white border-none rounded-lg px-4 py-2 text-sm font-medium cursor-pointer transition-all hover:bg-[#2563eb] disabled:bg-[#4a4a4e] disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={(e) => {
                      handleSubmit(e, false, 'machine learning');
                      setQuery('machine learning');
                    }}
                    title="I'm feeling lucky"
                  >
                    {loading ? <span className="btn-spinner" aria-hidden="true" /> : <Icon name="dice" ariaLabel="I'm feeling lucky" />}
                  </button>
                  <button
                    type="button"
                    className={`bg-[#151517] text-[#c9c9ce] border border-[#2a2a2e] rounded-lg p-2 text-sm cursor-pointer transition-all flex items-center justify-center hover:bg-[#1a1a1c] hover:border-[#3a3a3e] hover:text-[#eaeaea] ${
                      isHistoryOpen ? 'bg-[#3a82ff] text-white border-[#3a82ff]' : ''
                    }`}
                    onClick={toggleHistory}
                    title="View search history"
                  >
                    <Icon name="book" ariaLabel="History" />
                  </button>
                </div>
              </div>
              {error && retryCount > 0 && (
                <div className="mt-2 text-xs text-[#a0a0a5] text-center">
                  <span>Retrying... ({retryCount}/2)</span>
                </div>
              )}
            </form>
          </div>

          <QueryHistoryPanel
            history={history}
            loading={historyLoading}
            error={historyError}
            isAuthenticated={isAuthenticated}
            onQueryClick={handleHistoryQueryClick}
            onClearHistory={clearHistory}
            formatTimestamp={formatQueryTimestamp}
            isOpen={isHistoryOpen}
            onToggle={toggleHistory}
          />

          {loading && (
            <div className="text-center py-12 px-4 text-[#a0a0a5]">
              <div className="w-8 h-8 border-3 border-[#2a2a2e] border-t-[#3a82ff] rounded-full animate-spin mx-auto mb-4"></div>
              <p>Searching for papers...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 px-4 text-[#ff6b6b]">
              <div className="text-3xl mb-4"><Icon name="warning" ariaLabel="Error" /></div>
              <p>{error}</p>
              <div className="flex gap-3 justify-center mt-4">
                <button onClick={handleRetry} className="bg-[#ff6b6b] text-white border-none py-2 px-4 rounded-md text-sm cursor-pointer transition-all hover:bg-[#ff5252] disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
                  {loading ? 'Retrying...' : 'Retry Search'}
                </button>
                <button onClick={clearResults} className="bg-[#151517] text-[#c9c9ce] border border-[#2a2a2e] py-2 px-4 rounded-md text-sm cursor-pointer transition-all hover:bg-[#1a1a1c] hover:border-[#3a3a3e] hover:text-[#eaeaea]">
                  Clear
                </button>
              </div>
            </div>
          )}

          {!loading && !error && (results.length > 0 || queryGraphs.length > 0) && graphData && (
            <div className="mt-8">
              {queryGraphs.length > 0 && (
                <QueryFilterPanel
                  queryGraphs={queryGraphs}
                  onToggleVisibility={handleToggleQueryVisibility}
                  onRemoveQuery={handleRemoveQuery}
                />
              )}
              
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-[#eaeaea] m-0">
                  Paper Relationship Graph ({graphData.nodes.length} papers)
                </h2>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-4 px-4 py-3 bg-[#151517] border border-[#2a2a2e] rounded-lg flex-wrap">
                    <label htmlFor="layer-slider" className="text-sm text-[#c9c9ce] font-medium flex items-center gap-2 whitespace-nowrap">
                      Layer: <span className="text-[#3a82ff] font-semibold text-base">
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
                      onChange={(e) => {
                        const newDepth = parseInt(e.target.value, 10);
                        setCurrentDepth(newDepth);
                      }}
                      className="flex-1 min-w-[150px] h-1.5 rounded bg-[#2a2a2e] outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[18px] [&::-webkit-slider-thumb]:h-[18px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#3a82ff] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:bg-[#2563eb] [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:bg-[#1d4ed8] [&::-webkit-slider-thumb]:active:scale-115 [&::-moz-range-thumb]:w-[18px] [&::-moz-range-thumb]:h-[18px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#3a82ff] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-[0_2px_4px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:bg-[#2563eb] [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:bg-[#1d4ed8] [&::-moz-range-thumb]:active:scale-115 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={expandingLayer || loading}
                      title={`Current layer: ${queryGraphs.length > 0 
                        ? Math.max(...queryGraphs.map(qg => qg.currentDepth || 1))
                        : currentDepth
                      }/3`}
                    />
                    <div className="flex items-center">
                      <span className="text-xs text-[#6b7280] whitespace-nowrap">Limits: 10 / 40 / 80</span>
                    </div>
                    {expandingLayer && (
                      <span className="text-sm text-[#3a82ff] font-medium whitespace-nowrap animate-pulse">
                        <Icon name="hourglass" ariaLabel="Expanding" /> <span className="ml-1.5">Expanding...</span>
                      </span>
                    )}
                  </div>
                  <button onClick={clearResults} className="bg-[#151517] text-[#c9c9ce] border border-[#2a2a2e] py-1.5 px-3 rounded-md text-xs cursor-pointer transition-all hover:bg-[#1a1a1c] hover:border-[#3a3a3e] hover:text-[#eaeaea]">
                    Clear Results
                  </button>
                </div>
              </div>
              
              <div className="bg-[#151517] border border-[#2a2a2e] rounded-lg px-4 py-3 mb-4 flex items-center gap-4 flex-wrap">
                <div className="text-sm font-semibold text-[#c9c9ce] whitespace-nowrap">Visual Guide:</div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-3 text-xs text-[#a0a0a5]">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full border border-[#2a2a2e] flex-shrink-0" style={{ background: '#3a82ff', opacity: 1.0 }}></div>
                      <div className="w-4 h-4 rounded-full border border-[#2a2a2e] flex-shrink-0" style={{ background: '#3a82ff', opacity: 0.75 }}></div>
                      <div className="w-4 h-4 rounded-full border border-[#2a2a2e] flex-shrink-0" style={{ background: '#3a82ff', opacity: 0.5 }}></div>
                    </div>
                    <span>Layer Depth → Opacity (1.0 / 0.75 / 0.5)</span>
                  </div>
                  <div className="flex items-center">
                    <div className="text-xs text-[#6b7280] italic">
                      <span>Each query has a unique color. Opacity indicates layer depth.</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <GraphVisualization 
                  graphData={graphData} 
                  onNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                  height={600}
                />
              </div>
              {selectedNode && (
                <div className="bg-[#151517] border border-[#2a2a2e] rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)] mt-4 transition-all hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:border-[#3a3a3e]">
                  <h3 className="text-lg font-semibold text-[#eaeaea] m-0 mb-4">Selected Paper</h3>
                  <p className="text-[0.9375rem] text-[#c9c9ce] leading-relaxed m-2"><strong className="text-[#eaeaea] font-semibold">Title:</strong> {selectedNode.title}</p>
                  <p className="text-[0.9375rem] text-[#c9c9ce] leading-relaxed m-2"><strong className="text-[#eaeaea] font-semibold">Authors:</strong> {selectedNode.authors?.join(', ') || 'Unknown'}</p>
                  {selectedNode.year && <p className="text-[0.9375rem] text-[#c9c9ce] leading-relaxed m-2"><strong className="text-[#eaeaea] font-semibold">Year:</strong> {selectedNode.year}</p>}
                  {selectedNode.citations && <p className="text-[0.9375rem] text-[#c9c9ce] leading-relaxed m-2"><strong className="text-[#eaeaea] font-semibold">Citations:</strong> {selectedNode.citations}</p>}
                  {selectedNode.url && (
                    <p className="text-[0.9375rem] text-[#c9c9ce] leading-relaxed m-2">
                      <a href={selectedNode.url} target="_blank" rel="noopener noreferrer" className="text-[#3a82ff] no-underline text-sm font-medium transition-colors hover:text-[#60a5fa]">
                        View Paper →
                      </a>
                    </p>
                  )}
                  <button
                    onClick={() => handleSavePaper(selectedNode)}
                    className="bg-[#10b981] text-white border-none py-1.5 px-3 rounded-md text-sm font-medium cursor-pointer transition-all whitespace-nowrap inline-flex items-center gap-2 leading-none hover:bg-[#059669] mt-4"
                    title="Save paper"
                  >
                    <Icon name="save" ariaLabel="Save paper" />
                    <span>Save Paper</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {!loading && !error && results.length === 0 && queryGraphs.length === 0 && (
            <div className="text-center py-16 px-4 text-[#a0a0a5]">
              <div className="text-5xl mb-4"><Icon name="search" ariaLabel="Start searching" /></div>
              <h3 className="text-xl font-semibold text-[#eaeaea] m-0 mb-2">Start Your Research Journey</h3>
              <p className="m-0 mb-8 text-[0.9375rem] text-[#a0a0a5]">Enter a research question or keywords to discover relevant academic papers.</p>
              <div>
                <p className="text-sm font-medium text-[#c9c9ce] mb-5 block leading-snug">Try searching for:</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button 
                    className="bg-[#151517] border border-[#2a2a2e] text-[#c9c9ce] py-1.5 px-3 rounded-md text-xs cursor-pointer transition-all hover:bg-[#1a1a1c] hover:border-[#3a3a3e] hover:text-[#eaeaea]"
                    onClick={() => setQuery('machine learning')}
                  >
                    machine learning
                  </button>
                  <button 
                    className="bg-[#151517] border border-[#2a2a2e] text-[#c9c9ce] py-1.5 px-3 rounded-md text-xs cursor-pointer transition-all hover:bg-[#1a1a1c] hover:border-[#3a3a3e] hover:text-[#eaeaea]"
                    onClick={() => setQuery('artificial intelligence')}
                  >
                    artificial intelligence
                  </button>
                  <button 
                    className="bg-[#151517] border border-[#2a2a2e] text-[#c9c9ce] py-1.5 px-3 rounded-md text-xs cursor-pointer transition-all hover:bg-[#1a1a1c] hover:border-[#3a3a3e] hover:text-[#eaeaea]"
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
    </div>
  );
}


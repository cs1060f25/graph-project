// client/src/pages/QueryPage.jsx
// Main Query Page component with ChatGPT-style interface

import { useState } from 'react';
import { Link } from 'react-router-dom';
import APIHandlerInterface from '../handlers/api-handler/APIHandlerInterface';
import './QueryPage.css';

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);

  // Initialize API handler
  const apiHandler = new APIHandlerInterface({ maxResults: 10 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await apiHandler.makeQuery(query.trim(), { 
        type: "keyword",
        userId: "demo-user" // Using demo user for now
      });
      
      setResults(searchResults);
      setQueryHistory(prev => [...prev, { query: query.trim(), timestamp: new Date() }]);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Failed to search papers. Please try again.');
    } finally {
      setLoading(false);
    }
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
                {queryHistory.slice(-3).reverse().map((item, index) => (
                  <button
                    key={index}
                    className="history-item"
                    onClick={() => setQuery(item.query)}
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
              <button onClick={clearResults} className="retry-button">
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
    </div>
  );
}
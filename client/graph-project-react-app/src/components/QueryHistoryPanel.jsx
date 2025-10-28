// client/src/components/QueryHistoryPanel.jsx
// Component for displaying query history in a sidebar panel

import { useState } from 'react';
import './QueryHistoryPanel.css';

/**
 * QueryHistoryPanel Component
 * Displays query history in a collapsible sidebar panel
 * 
 * @param {Object} props
 * @param {Array} props.history - Array of query history items
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @param {boolean} props.isAuthenticated - Whether user is logged in
 * @param {Function} props.onQueryClick - Callback when a query is clicked
 * @param {Function} props.onClearHistory - Callback to clear history
 * @param {Function} props.formatTimestamp - Function to format timestamps
 */
export default function QueryHistoryPanel({
  history = [],
  loading = false,
  error = null,
  isAuthenticated = false,
  onQueryClick,
  onClearHistory,
  formatTimestamp
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQueryClick = (queryItem) => {
    if (onQueryClick) {
      onQueryClick(queryItem.query);
    }
    setIsExpanded(false); // Collapse panel after selection
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all query history?')) {
      onClearHistory?.();
    }
  };

  return (
    <div className={`query-history-panel ${isExpanded ? 'expanded' : ''}`}>
      {/* Toggle Button */}
      <button
        className="history-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Hide history' : 'Show history'}
      >
        <span className="history-icon">📚</span>
        <span className="history-label">History</span>
        {history.length > 0 && (
          <span className="history-count">{history.length}</span>
        )}
        <span className="expand-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Panel Content */}
      {isExpanded && (
        <div className="history-content">
          <div className="history-header">
            <h3>Past Searches</h3>
            {isAuthenticated && history.length > 0 && (
              <button
                className="clear-history-btn"
                onClick={handleClearHistory}
                title="Clear all history"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="history-body">
            {/* Authentication States */}
            {!isAuthenticated ? (
              <div className="history-empty">
                <div className="empty-icon">🔒</div>
                <p>Login to view your search history</p>
              </div>
            ) : loading ? (
              <div className="history-loading">
                <div className="loading-spinner"></div>
                <p>Loading history...</p>
              </div>
            ) : error ? (
              <div className="history-error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="history-empty">
                <div className="empty-icon">🔍</div>
                <p>No searches yet</p>
                <small>Your search history will appear here</small>
              </div>
            ) : (
              <div className="history-list">
                {history.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="history-item"
                    onClick={() => handleQueryClick(item)}
                  >
                    <div className="history-query">
                      <span className="query-text">{item.query}</span>
                      {item.resultCount > 0 && (
                        <span className="result-count">
                          {item.resultCount} results
                        </span>
                      )}
                    </div>
                    <div className="history-meta">
                      <span className="query-type">{item.type}</span>
                      <span className="query-time">
                        {formatTimestamp?.(item.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

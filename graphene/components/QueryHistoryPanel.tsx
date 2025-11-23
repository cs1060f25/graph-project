'use client';

// import './QueryHistoryPanel.css';
// components/QueryHistoryPanel.tsx
import Icon from './Icon';
import './QueryHistoryPanel.css';

interface QueryHistoryItem {
  query: string;
  type?: string;
  timestamp: string | number;
  resultCount?: number;
}

interface QueryHistoryPanelProps {
  history?: QueryHistoryItem[];
  loading?: boolean;
  error?: string | null;
  isAuthenticated?: boolean;
  onQueryClick?: (query: string) => void;
  onClearHistory?: () => void;
  formatTimestamp: (timestamp: string | number) => string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function QueryHistoryPanel({
  history = [],
  loading = false,
  error = null,
  isAuthenticated = false,
  onQueryClick,
  onClearHistory,
  formatTimestamp,
  isOpen,
  onToggle
}: QueryHistoryPanelProps) {
  const handleQueryClick = (queryItem: QueryHistoryItem) => {
    if (onQueryClick) {
      onQueryClick(queryItem.query);
    }
    if (onToggle) {
      onToggle(); // Close panel after selection
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all query history?')) {
      onClearHistory?.();
    }
  };

  // Always render the container, but conditionally add the 'open' class
  return (
    <div className={`query-history-accordion ${isOpen ? 'open' : 'closed'}`}>
      {/* Triangle pointer to create speech bubble effect */}
      <div className="history-pointer"></div>
      
      <div className="history-content">
        <div className="history-header">
          <h3>Search History</h3>
          {isAuthenticated && history.length > 0 && (
            <button
              className="clear-history-btn"
              onClick={handleClearHistory}
            >
              Clear History
            </button>
          )}
        </div>

        <div className="history-body">
          {loading && (
            <div className="history-loading">
              <Icon name="hourglass" />
              <p>Loading history...</p>
            </div>
          )}
          
          {error && (
            <div className="history-error">
              <Icon name="warning" />
              <p>Failed to load history</p>
            </div>
          )}
          
          {!loading && !error && history.length === 0 && (
            <div className="history-empty">
              <Icon name="clipboard" className="empty-icon" />
              <p>No search history yet</p>
              <small>Your recent searches will appear here</small>
            </div>
          )}
          
          {!loading && !error && history.length > 0 && (
            <div className="history-list">
              {history.map((item, index) => (
                <div 
                  key={index}
                  className="history-item"
                  onClick={() => handleQueryClick(item)}
                >
                  <div className="history-query">{item.query}</div>
                  <div className="history-meta">
                    <span className="query-type">{item.type || 'search'}</span>
                    <span className="query-time">{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



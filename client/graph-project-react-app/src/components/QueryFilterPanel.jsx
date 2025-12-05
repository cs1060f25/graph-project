/**
 * Query Filter Panel
 * 
 * Displays a list of active queries with color swatches and visibility toggles.
 * Allows users to show/hide individual queries and remove them.
 */

import React from 'react';
import './QueryFilterPanel.css';

const QueryFilterPanel = ({ 
  queryGraphs, 
  onToggleVisibility, 
  onRemoveQuery,
  isCollapsed = false,
  onToggleCollapse
}) => {
  if (!queryGraphs || queryGraphs.length === 0) {
    return null;
  }

  return (
    <div className={`query-filter-panel ${isCollapsed ? 'panel-collapsed' : ''}`}>
      <div className="filter-panel-header">
        <button 
          className="collapse-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Show Active Queries' : 'Hide Active Queries'}
          aria-label={isCollapsed ? 'Show Active Queries' : 'Hide Active Queries'}
          aria-expanded={!isCollapsed}
        >
          <span className="collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
        </button>
        <h3 className="filter-panel-title">Active Queries</h3>
        <span className="query-count">{queryGraphs.length}</span>
      </div>
      
      <div className="query-list" style={{ display: isCollapsed ? 'none' : 'flex' }}>
        {queryGraphs.map((queryGraph) => (
          <div
            key={queryGraph.id}
            className={`query-item ${!queryGraph.visible ? 'query-hidden' : ''}`}
          >
            <div className="query-item-content">
              <div className="query-color-swatch" style={{ backgroundColor: queryGraph.color }} />
              
              <label className="query-toggle-label">
                <input
                  type="checkbox"
                  checked={queryGraph.visible}
                  onChange={() => onToggleVisibility(queryGraph.id)}
                  className="query-toggle-checkbox"
                />
                <span className="query-label-text" title={queryGraph.fullLabel || queryGraph.label}>
                  {queryGraph.label}
                </span>
              </label>
              
              <button
                className="query-remove-button"
                onClick={() => onRemoveQuery(queryGraph.id)}
                title="Remove this query"
                aria-label={`Remove query: ${queryGraph.label}`}
              >
                ×
              </button>
            </div>
            
            <div className="query-meta">
              <span className="query-paper-count">{queryGraph.papers?.length || 0} papers</span>
            </div>
          </div>
        ))}
      </div>
      
      {queryGraphs.length > 1 && !isCollapsed && (
        <div className="filter-panel-actions">
          <button
            className="show-all-button"
            onClick={() => {
              queryGraphs.forEach(qg => {
                if (!qg.visible) onToggleVisibility(qg.id);
              });
            }}
          >
            Show All
          </button>
          <button
            className="hide-all-button"
            onClick={() => {
              queryGraphs.forEach(qg => {
                if (qg.visible) onToggleVisibility(qg.id);
              });
            }}
          >
            Hide All
          </button>
        </div>
      )}
    </div>
  );
};

export default QueryFilterPanel;


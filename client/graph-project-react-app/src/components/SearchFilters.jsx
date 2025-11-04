// client/src/components/SearchFilters.jsx
// Filter controls for advanced search

import { useState } from 'react';
import './SearchFilters.css';

export default function SearchFilters({ 
  papers, 
  onFiltersChange, 
  onSortChange,
  currentSort = 'relevance'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minCitations: '',
    venue: '',
    tags: [],
    hasAbstract: false,
  });

  // Get unique venues and tags from papers
  const uniqueVenues = [...new Set(papers.map(p => p.venue).filter(Boolean))];
  const uniqueTags = [...new Set(papers.flatMap(p => p.tags || []))];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSortChange = (e) => {
    onSortChange(e.target.value);
  };

  const clearFilters = () => {
    const emptyFilters = {
      dateFrom: '',
      dateTo: '',
      minCitations: '',
      venue: '',
      tags: [],
      hasAbstract: false,
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const activeFilterCount = Object.values(filters).filter(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'boolean') return v;
    return v !== '';
  }).length;

  return (
    <div className="search-filters">
      <div className="filters-header">
        <button 
          className="filters-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="filter-icon">🔍</span>
          Filters
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
          <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </button>

        <div className="sort-control">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select"
            value={currentSort} 
            onChange={handleSortChange}
            className="sort-select"
          >
            <option value="relevance">Relevance</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="citations-desc">Most Citations</option>
            <option value="citations-asc">Least Citations</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      {isOpen && (
        <div className="filters-panel">
          <div className="filters-grid">
            {/* Date Range */}
            <div className="filter-group">
              <label>Publication Date</label>
              <div className="date-range">
                <input
                  type="number"
                  placeholder="From year"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="To year"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Citations */}
            <div className="filter-group">
              <label htmlFor="min-citations">Minimum Citations</label>
              <input
                id="min-citations"
                type="number"
                placeholder="e.g., 100"
                value={filters.minCitations}
                onChange={(e) => handleFilterChange('minCitations', e.target.value)}
                min="0"
              />
            </div>

            {/* Venue */}
            {uniqueVenues.length > 0 && (
              <div className="filter-group">
                <label htmlFor="venue-select">Venue</label>
                <select
                  id="venue-select"
                  value={filters.venue}
                  onChange={(e) => handleFilterChange('venue', e.target.value)}
                >
                  <option value="">All Venues</option>
                  {uniqueVenues.map(venue => (
                    <option key={venue} value={venue}>{venue}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Tags */}
            {uniqueTags.length > 0 && (
              <div className="filter-group">
                <label>Tags</label>
                <div className="tags-filter">
                  {uniqueTags.map(tag => (
                    <label key={tag} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag)}
                        onChange={(e) => {
                          const newTags = e.target.checked
                            ? [...filters.tags, tag]
                            : filters.tags.filter(t => t !== tag);
                          handleFilterChange('tags', newTags);
                        }}
                      />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Has Abstract */}
            <div className="filter-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.hasAbstract}
                  onChange={(e) => handleFilterChange('hasAbstract', e.target.checked)}
                />
                <span>Has Abstract</span>
              </label>
            </div>
          </div>

          <div className="filters-actions">
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear All Filters
            </button>
            <span className="results-count">
              {activeFilterCount > 0 && `${activeFilterCount} filter(s) active`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';

function PaperCard({ paper, onFindSimilar, onSelectPaper, showSimilarButton = true }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const truncateAbstract = (text, maxLength = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'cs.AI': '#3b82f6',
      'cs.LG': '#8b5cf6',
      'q-bio.GN': '#10b981',
      'physics.optics': '#f59e0b',
      'math.CO': '#ec4899'
    };
    return colors[category] || '#6366f1';
  };

  return (
    <div className="paper-card">
      <div className="paper-header">
        <div className="paper-category-badge" style={{ backgroundColor: getCategoryColor(paper.category) }}>
          {paper.category}
        </div>
        <div className="paper-date">{formatDate(paper.published_date)}</div>
      </div>

      <h3 className="paper-title">{paper.title}</h3>

      <div className="paper-authors">
        {paper.authors.slice(0, 3).join(', ')}
        {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
      </div>

      <p className="paper-abstract">{truncateAbstract(paper.abstract)}</p>

      <div className="paper-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => onSelectPaper(paper)}
          aria-label="Summarize paper with AI"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Summarize
        </button>

        {showSimilarButton && (
          <button 
            className="btn btn-secondary"
            onClick={() => onFindSimilar(paper.id)}
            aria-label="Find similar papers"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            Find Similar
          </button>
        )}

        <a 
          href={paper.pdf_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-primary"
          aria-label="View PDF"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          View PDF
        </a>
      </div>
    </div>
  );
}

export default PaperCard;
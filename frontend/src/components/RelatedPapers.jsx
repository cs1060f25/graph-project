import React from 'react';
import PaperCard from './PaperCard';

function RelatedPapers({ papers, onSelectPaper }) {
  if (papers.length === 0) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        <h3>No related papers yet</h3>
        <p>Related papers will appear here based on your library</p>
      </div>
    );
  }

  return (
    <div className="related-papers">
      <div className="paper-grid">
        {papers.map((paper) => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onSelectPaper={onSelectPaper}
            showSimilarButton={false}
          />
        ))}
      </div>
    </div>
  );
}

export default RelatedPapers;
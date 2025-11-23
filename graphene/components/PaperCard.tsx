'use client';

// import './PaperCard.css';
// components/PaperCard.tsx
// Component for displaying an individual saved paper

import { useState } from 'react';
import Icon from './Icon';
import { Paper, Folder } from '../lib/services/userApi';
import './PaperCard.css';

interface PaperCardProps {
  paper: Paper;
  onToggleStar: (paperId: string) => void;
  onRemove: (paperId: string) => void;
  onMoveToFolder?: (paperId: string, folderId: string | null) => void;
  folders?: Folder[];
}

/**
 * PaperCard Component
 * Displays a single paper with title, authors, abstract, and actions
 */
export default function PaperCard({ 
  paper, 
  onToggleStar, 
  onRemove,
  onMoveToFolder,
  folders = []
}: PaperCardProps) {
  const [showActions, setShowActions] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Format date
  const formatDate = (timestamp?: string): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Truncate abstract
  const truncateText = (text?: string, maxLength: number = 200): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const handleRemove = () => {
    setShowDeleteConfirm(false);
    onRemove(paper.id);
  };

  return (
    <div className="paper-card">
      {/* Header */}
      <div className="paper-card-header">
        <div className="paper-card-meta">
          <span className="paper-card-date">{formatDate(paper.publishedDate)}</span>
          {paper.starred && <span className="paper-card-badge"><Icon name="star" ariaLabel="Starred" /> <span style={{ marginLeft: 6 }}>Starred</span></span>}
        </div>
        
        <div className="paper-card-actions">
          <button
            className={`icon-btn star-btn ${paper.starred ? 'starred' : ''}`}
            onClick={() => onToggleStar(paper.id)}
            title={paper.starred ? 'Unstar' : 'Star'}
          >
            <Icon name="star" ariaLabel={paper.starred ? 'Unstar' : 'Star'} />
          </button>
          
          <button
            className="icon-btn more-btn"
            onClick={() => setShowActions(!showActions)}
            title="More actions"
          >
            ⋮
          </button>
        </div>

        {/* Actions dropdown */}
        {showActions && (
          <div className="paper-card-dropdown">
            {folders.length > 0 && (
              <div className="dropdown-section">
                <div className="dropdown-label">Move to folder:</div>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    className="dropdown-item"
                    onClick={() => {
                      onMoveToFolder?.(paper.id, folder.id);
                      setShowActions(false);
                    }}
                  >
                    <Icon name="folder" ariaLabel={`Folder ${folder.name}`} /> <span style={{ marginLeft: 8 }}>{folder.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            <button
              className="dropdown-item danger"
              onClick={() => {
                setShowDeleteConfirm(true);
                setShowActions(false);
              }}
            >
              <Icon name="warning" ariaLabel="Remove" /> <span style={{ marginLeft: 8 }}>Remove paper</span>
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="paper-card-title">
        <a 
          href={paper.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="paper-card-link"
        >
          {paper.title}
        </a>
      </h3>

      {/* Authors */}
      {paper.authors && paper.authors.length > 0 && (
        <div className="paper-card-authors">
          {Array.isArray(paper.authors) 
            ? paper.authors.join(', ')
            : paper.authors}
        </div>
      )}

      {/* Abstract */}
      {paper.abstract && (
        <p className="paper-card-abstract">
          {truncateText(paper.abstract)}
        </p>
      )}

      {/* Footer */}
      <div className="paper-card-footer">
        <a 
          href={paper.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="paper-card-link-btn"
        >
          View Paper →
        </a>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="confirm-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Remove Paper?</h3>
            <p>Are you sure you want to remove "{paper.title}" from your saved papers?</p>
            <div className="confirm-modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleRemove}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



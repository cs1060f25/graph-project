import { BookOpen, ExternalLink, Users } from 'lucide-react';
import { Paper } from '../lib/supabase';

interface PaperCardProps {
  paper: Paper;
  onSelect: (paper: Paper) => void;
}

export function PaperCard({ paper, onSelect }: PaperCardProps) {
  const topicColors: Record<string, string> = {
    'Machine Learning': 'var(--accent-blue)',
    'Computer Vision': 'var(--accent-teal)',
    'Natural Language Processing': 'var(--accent-emerald)',
    'Quantum Computing': 'var(--accent-amber)',
    'Bioinformatics': 'var(--accent-rose)',
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px',
        transition: 'var(--transition)',
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={() => onSelect(paper)}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            padding: '6px 12px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${topicColors[paper.topic] || 'var(--accent-blue)'}`,
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            color: topicColors[paper.topic] || 'var(--accent-blue)',
          }}
        >
          {paper.topic}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
          {new Date(paper.published_date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>

      <h3
        style={{
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '10px',
          color: 'var(--text-primary)',
          lineHeight: '1.4',
        }}
      >
        {paper.title}
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <Users size={14} style={{ color: 'var(--text-tertiary)' }} />
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {paper.authors.join(', ')}
        </p>
      </div>

      <p
        style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: '16px',
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {paper.abstract}
      </p>

      <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(paper);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: 'var(--accent-blue)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
            flex: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-blue-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
          }}
        >
          <BookOpen size={16} />
          Summarize
        </button>
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: '500',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
        >
          <ExternalLink size={16} />
          View
        </a>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Icon from './Icon';
import type { Paper, Folder } from '../lib/api/user';

interface PaperCardProps {
  paper: Paper;
  onToggleStar: (paperId: string) => Promise<void>;
  onRemove: (paperId: string) => Promise<void>;
  onMoveToFolder: (paperId: string, folderId: string | null) => Promise<void>;
  folders?: Folder[];
}

function formatDate(timestamp?: number | string): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function truncateText(text: string | undefined, maxLength: number = 200): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function handleStar(paperId: string, onToggleStar: (paperId: string) => Promise<void>): void {
  onToggleStar(paperId);
}

function handleRemove(
  paperId: string,
  onRemove: (paperId: string) => Promise<void>,
  setShowDeleteConfirm: (show: boolean) => void
): void {
  setShowDeleteConfirm(false);
  onRemove(paperId);
}

function handleMoveToFolder(
  paperId: string,
  folderId: string | null,
  onMoveToFolder: (paperId: string, folderId: string | null) => Promise<void>,
  setShowActions: (show: boolean) => void
): void {
  onMoveToFolder(paperId, folderId);
  setShowActions(false);
}

export default function PaperCard({ 
  paper, 
  onToggleStar, 
  onRemove,
  onMoveToFolder,
  folders = []
}: PaperCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="bg-[#151517] text-[#eaeaea] border border-[#2a2a2e] rounded-xl p-5 mb-4 transition-all hover:shadow-[0_6px_18px_rgba(0,0,0,0.6)] hover:-translate-y-0.5 relative">
      <div className="flex justify-between items-center mb-3 relative">
        <div className="flex gap-3 items-center">
          <span className="text-sm text-[#888]">{formatDate(paper.createdAt as any)}</span>
          {paper.starred && (
            <span className="text-sm py-1 px-2 bg-[rgba(251,191,36,0.12)] text-[#fbbf24] rounded-md font-medium inline-flex items-center gap-1.5 leading-none">
              <Icon name="star" ariaLabel="Starred" />
              <span>Starred</span>
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            className={`bg-transparent border-none cursor-pointer text-2xl p-1 rounded-md transition-all text-[#888] hover:bg-[#1a1a1c] ${
              paper.starred ? 'text-[#fbbf24]' : ''
            }`}
            onClick={() => handleStar(paper.id, onToggleStar)}
            title={paper.starred ? 'Unstar' : 'Star'}
          >
            <Icon name="star" ariaLabel={paper.starred ? 'Unstar' : 'Star'} />
          </button>
          
          <button
            className="bg-transparent border-none cursor-pointer text-2xl p-1 rounded-md transition-all text-[#888] hover:bg-[#1a1a1c]"
            onClick={() => setShowActions(!showActions)}
            title="More actions"
          >
            ⋮
          </button>
        </div>

        {showActions && (
          <div className="absolute top-10 right-0 bg-[#1a1a1c] border border-[#2a2a2e] rounded-lg shadow-[0_8px_20px_rgba(0,0,0,0.6)] min-w-[200px] z-10 p-2">
            {folders.length > 0 && (
              <div className="border-b border-[#2a2a2e] pb-2 mb-2">
                <div className="text-xs font-semibold text-[#888] uppercase py-1 px-2 mb-1">Move to folder:</div>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    className="w-full text-left bg-transparent border-none py-2 px-3 rounded-md cursor-pointer text-sm text-[#eaeaea] transition-all hover:bg-[#151517] flex items-center gap-2"
                    onClick={() => handleMoveToFolder(paper.id, folder.id, onMoveToFolder, setShowActions)}
                  >
                    <Icon name="folder" ariaLabel={`Folder ${folder.name}`} />
                    <span>{folder.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            <button
              className="w-full text-left bg-transparent border-none py-2 px-3 rounded-md cursor-pointer text-sm text-[#dc2626] transition-all hover:bg-[rgba(239,68,68,0.08)] flex items-center gap-2"
              onClick={() => {
                setShowDeleteConfirm(true);
                setShowActions(false);
              }}
            >
              <Icon name="warning" ariaLabel="Remove" />
              <span>Remove paper</span>
            </button>
          </div>
        )}
      </div>

      <h3 className="text-xl font-semibold text-[#eaeaea] m-0 mb-2 leading-snug">
        <a 
          href={paper.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[#3a82ff] no-underline transition-colors hover:text-[#60a5fa] hover:underline"
        >
          {paper.title}
        </a>
      </h3>

      {paper.authors && paper.authors.length > 0 && (
        <div className="text-sm text-[#888] mb-3 italic">
          {Array.isArray(paper.authors) 
            ? paper.authors.join(', ')
            : paper.authors}
        </div>
      )}

      {paper.abstract && (
        <p className="text-[0.9375rem] text-[#eaeaea] leading-relaxed m-3">
          {truncateText(paper.abstract)}
        </p>
      )}

      <div className="mt-4 pt-4 border-t border-[#2a2a2e]">
        <a 
          href={paper.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-[#3a82ff] no-underline transition-colors hover:text-[#60a5fa]"
        >
          View Paper →
        </a>
      </div>

      {showDeleteConfirm && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[1000]" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[#151517] rounded-xl p-6 max-w-[400px] w-[90%] shadow-[0_20px_40px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
            <h3 className="m-0 mb-3 text-xl text-[#eaeaea]">Remove Paper?</h3>
            <p className="m-0 mb-5 text-[#888] leading-relaxed">Are you sure you want to remove "{paper.title}" from your saved papers?</p>
            <div className="flex gap-3 justify-end">
              <button 
                className="py-2 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all bg-[#1a1a1c] text-[#eaeaea] hover:bg-[#151517]"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="py-2 px-4 border-none rounded-lg text-sm font-medium cursor-pointer transition-all bg-[#dc2626] text-white hover:bg-[#b91c1c]"
                onClick={() => handleRemove(paper.id, onRemove, setShowDeleteConfirm)}
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


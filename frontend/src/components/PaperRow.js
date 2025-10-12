import React from 'react';
import './PaperRow.css';

export default function PaperRow({ paper, fetchData }) {
  const handleDelete = async () => {
    await fetch(`http://localhost:5000/api/papers/${paper.id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleMoveFolder = async () => {
    const folderId = prompt('Enter folder ID to move paper:');
    if (!folderId) return;
    await fetch(`http://localhost:5000/api/papers/${paper.id}/folder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId }),
    });
    fetchData();
  };

  const handleOpenLink = () => {
    window.open(paper.link, '_blank');

    // Update recent papers in localStorage
    let recent = JSON.parse(localStorage.getItem('recentPapers') || '[]');
    
    // Remove if already exists
    recent = recent.filter(p => p.id !== paper.id);
    // Add to top
    recent.unshift(paper);
    // Keep max 10
    if (recent.length > 10) recent.pop();

    localStorage.setItem('recentPapers', JSON.stringify(recent));
  };


  return (
    <div className="paper-row">
      <span className="paper-title" onClick={handleOpenLink}>{paper.title}</span>
      <span>{paper.authors}</span>
      <span>{paper.year}</span>
      <span>{paper.folder_name || 'No folder'}</span>
      <button onClick={handleMoveFolder}>☰</button>
      <button onClick={handleDelete}>🗑</button>
    </div>
  );
}

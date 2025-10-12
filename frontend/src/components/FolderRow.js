import React, { useState, useEffect } from 'react';
import PaperRow from './PaperRow';
import './FolderRow.css';

export default function FolderRow({ folder, fetchData }) {
  const [papers, setPapers] = useState([]);
  const [showPapers, setShowPapers] = useState(false);

  const fetchFolderPapers = async () => {
    const res = await fetch('http://localhost:5000/api/papers');
    const allPapers = await res.json();
    setPapers(allPapers.filter(p => p.folder_id === folder.id));
  };

  useEffect(() => {
    if (showPapers) fetchFolderPapers();
  }, [showPapers]);

  return (
    <div>
      <div className="folder-row" onClick={() => setShowPapers(!showPapers)}>
        📁 {folder.name}
      </div>
      {showPapers && papers.map(p => (
        <PaperRow key={p.id} paper={p} fetchData={fetchData} />
      ))}
    </div>
  );
}

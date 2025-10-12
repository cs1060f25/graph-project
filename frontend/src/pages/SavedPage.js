import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import PaperRow from '../components/PaperRow';
import FolderRow from '../components/FolderRow';
import './SavedPage.css';

export default function SavedPage() {
  const [selection, setSelection] = useState('folders');
  const [papers, setPapers] = useState([]);
  const [folders, setFolders] = useState([]);

  const fetchData = async () => {
    const papersRes = await fetch('http://localhost:5000/api/papers');
    const foldersRes = await fetch('http://localhost:5000/api/folders');
    setPapers(await papersRes.json());
    setFolders(await foldersRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFolder = async () => {
    const folderName = prompt('Enter new folder name:');
    if (!folderName) return;

    await fetch('http://localhost:5000/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: folderName }),
    });
    fetchData();
  };

  const renderMain = () => {
    if (selection === 'all') {
      return papers.map(p => <PaperRow key={p.id} paper={p} fetchData={fetchData} />);
    }
    if (selection === 'folders') {
      return (
        <div>
          <button className="add-folder-btn" onClick={handleAddFolder}>+ Add Folder</button>
          {folders.map(f => <FolderRow key={f.id} folder={f} fetchData={fetchData} />)}
        </div>
      );
    }
    if (selection === 'recent') {
      const recentPapers = JSON.parse(localStorage.getItem('recentPapers') || '[]');
      return recentPapers.map(p => <PaperRow key={p.id} paper={p} fetchData={fetchData} />);
    }
  };

  return (
    <div className="saved-container">
      <Sidebar selection={selection} setSelection={setSelection} />
      <div className="saved-main">{renderMain()}</div>
    </div>
  );
}

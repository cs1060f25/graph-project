import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

export default function App() {
  const [papers, setPapers] = useState([]);
  const [folders, setFolders] = useState([
    { id: 1, name: 'Machine Learning' },
    { id: 2, name: 'Computer Vision' },
    { id: 3, name: 'NLP' }
  ]);
  const [nextFolderId, setNextFolderId] = useState(4);
  const [activeTab, setActiveTab] = useState('saved');
  const [sidebarActive, setSidebarActive] = useState('folders');
  const [recentPapers, setRecentPapers] = useState([]);
  const [menuOpen, setMenuOpen] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [notImplementedOpen, setNotImplementedOpen] = useState(false);

  // Load papers from Excel file
  useEffect(() => {
    const loadPapers = async () => {
      try {
        const response = await fetch('/papers.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        const loadedPapers = data.map((row, idx) => ({
          id: idx,
          title: row.Title || '',
          authors: row.Authors || '',
          year: row.Year || '',
          folder: row.Folder || null,
          link: row.Link || '',
          bookmarked: true
        }));
        
        setPapers(loadedPapers);
      } catch (error) {
        console.error('Error loading papers:', error);
      }
    };

    loadPapers();
  }, []);

  // Handle keyboard shortcuts
   useEffect(() => {
    const handleKeyPress = (e) => {
      if (sidebarActive === 'all') {
        let index = -1;
        
        if (e.key >= '1' && e.key <= '9') {
          index = parseInt(e.key) - 1;
        } else if (e.key === '0') {
          index = 9; // 0 represents the 10th item
        }
        
        if (index >= 0) {
          const visiblePapers = papers.filter(p => p.bookmarked);
          if (index < visiblePapers.length && visiblePapers[index].link) {
            window.open(visiblePapers[index].link, '_blank');
            handlePaperClick(visiblePapers[index].id);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [sidebarActive, papers]);

  const handlePaperClick = (paperId) => {
    const paper = papers.find(p => p.id === paperId);
    if (paper && paper.link) {
      setRecentPapers((prev) => {
        const filtered = prev.filter(p => p.id !== paperId);
        const updated = [paper, ...filtered].slice(0, 10);
        return updated;
      });
    }
  };

  const handleMenuOpen = (paperId, e) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === paperId ? null : paperId);
  };

  const handleDeletePaper = (paperId) => {
    setPapers((prev) =>
      prev.map((p) =>
        p.id === paperId ? { ...p, bookmarked: false } : p
      )
    );
    setMenuOpen(null);
  };

  const handleMovePaper = (paperId, folderId) => {
    setPapers((prev) =>
      prev.map((p) =>
        p.id === paperId ? { ...p, folder: folderId } : p
      )
    );
    setMenuOpen(null);
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      setFolders((prev) => [
        ...prev,
        { id: nextFolderId, name: newFolderName }
      ]);
      setNextFolderId((prev) => prev + 1);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const handleTabClick = (tab) => {
    if (tab === 'saved') {
      setActiveTab('saved');
    } else {
      setNotImplementedOpen(true);
    }
  };

  const handleNavClick = (e) => {
    e.stopPropagation();
  };

  const getVisiblePapers = () => {
    let visible = papers.filter((p) => p.bookmarked);

    if (sidebarActive === 'folders' && selectedFolder !== null) {
      visible = visible.filter((p) => p.folder === selectedFolder);
    } else if (sidebarActive === 'recent') {
      visible = recentPapers;
    }

    return visible;
  };

  const visiblePapers = getVisiblePapers();

  return (
    <div className="app-container">
      {/* Notification Modal */}
      {notImplementedOpen && (
        <div className="modal-overlay" onClick={() => setNotImplementedOpen(false)}>
          <div className="modal" onClick={handleNavClick}>
            <p>Not implemented</p>
            <button onClick={() => setNotImplementedOpen(false)}>OK</button>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-buttons">
          <button
            className={`nav-button ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => handleTabClick('query')}
          >
            Query
          </button>
          <button
            className={`nav-button ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => handleTabClick('saved')}
          >
            Saved
          </button>
          <button
            className={`nav-button ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => handleTabClick('portfolio')}
          >
            Portfolio
          </button>
        </div>
      </nav>

      <div className="main-container">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-title">SAVED</div>
          <button
            className={`sidebar-button ${sidebarActive === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSidebarActive('all');
              setSelectedFolder(null);
            }}
          >
            All
          </button>
          <button
            className={`sidebar-button ${sidebarActive === 'folders' ? 'active' : ''}`}
            onClick={() => {
              setSidebarActive('folders');
              setSelectedFolder(null);
            }}
          >
            Folders
          </button>
          <button
            className={`sidebar-button ${sidebarActive === 'recent' ? 'active' : ''}`}
            onClick={() => {
              setSidebarActive('recent');
              setSelectedFolder(null);
            }}
          >
            Recent
          </button>
        </aside>

        {/* Main Content */}
        <main className="content">
          {sidebarActive === 'all' && (
            <div className="papers-list">
              <div className="papers-header">All Papers ({visiblePapers.length})</div>
              {visiblePapers.length === 0 ? (
                <div className="empty-state">No papers found</div>
              ) : (
                visiblePapers.map((paper, idx) => (
                  <div key={paper.id} className="paper-row">
                    <div className="paper-index">{idx + 1}</div>
                    <div className="paper-content">
                      <div className="paper-title">{paper.title}</div>
                      <div className="paper-details">
                        <span className="paper-authors">{paper.authors}</span>
                        <span className="paper-year">{paper.year}</span>
                        {paper.folder && (
                          <span className="paper-folder">
                            📁 {folders.find((f) => f.id === paper.folder)?.name || 'Unknown'}
                          </span>
                        )}
                        {paper.link && (
                          <a
                            href={paper.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="paper-link"
                            onClick={() => handlePaperClick(paper.id)}
                          >
                            Link
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="paper-menu-container">
                      <button
                        className="menu-button"
                        onClick={(e) => handleMenuOpen(paper.id, e)}
                      >
                        ☰
                      </button>
                      {menuOpen === paper.id && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="menu-item"
                            onClick={() => handleDeletePaper(paper.id)}
                          >
                            Delete
                          </button>
                          <div className="menu-divider"></div>
                          <div className="menu-header">Move to Folder</div>
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              className="menu-item"
                              onClick={() => handleMovePaper(paper.id, folder.id)}
                            >
                              {folder.name}
                            </button>
                          ))}
                          <div className="menu-divider"></div>
                          <button
                            className="menu-item new-folder"
                            onClick={() => {
                              const name = prompt('Folder name:');
                              if (name) {
                                const newId = nextFolderId;
                                setFolders((prev) => [...prev, { id: newId, name }]);
                                setNextFolderId((prev) => prev + 1);
                                handleMovePaper(paper.id, newId);
                              }
                            }}
                          >
                            + New Folder
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {sidebarActive === 'folders' && !selectedFolder && (
            <div className="folders-view">
              <div className="folders-header">
                <span>Folders</span>
                <button
                  className="add-folder-btn"
                  onClick={() => setShowNewFolderInput(true)}
                >
                  +
                </button>
              </div>

              {showNewFolderInput && (
                <div className="new-folder-input">
                  <input
                    type="text"
                    placeholder="Folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                    }}
                    autoFocus
                  />
                  <button onClick={handleCreateFolder}>Create</button>
                  <button
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="folders-grid">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="folder-item"
                    onClick={() => setSelectedFolder(folder.id)}
                  >
                    <div className="folder-icon">📁</div>
                    <div className="folder-name">{folder.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sidebarActive === 'folders' && selectedFolder !== null && (
            <div className="papers-list">
              <div className="papers-header">
                <button
                  className="back-button"
                  onClick={() => setSelectedFolder(null)}
                >
                  ← Back to Folders
                </button>
                <span>
                  {folders.find((f) => f.id === selectedFolder)?.name} ({visiblePapers.length})
                </span>
              </div>
              {visiblePapers.length === 0 ? (
                <div className="empty-state">No papers in this folder</div>
              ) : (
                visiblePapers.map((paper, idx) => (
                  <div key={paper.id} className="paper-row">
                    <div className="paper-index">{idx + 1}</div>
                    <div className="paper-content">
                      <div className="paper-title">{paper.title}</div>
                      <div className="paper-details">
                        <span className="paper-authors">{paper.authors}</span>
                        <span className="paper-year">{paper.year}</span>
                        {paper.link && (
                          <a
                            href={paper.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="paper-link"
                            onClick={() => handlePaperClick(paper.id)}
                          >
                            Link
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="paper-menu-container">
                      <button
                        className="menu-button"
                        onClick={(e) => handleMenuOpen(paper.id, e)}
                      >
                        ☰
                      </button>
                      {menuOpen === paper.id && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="menu-item"
                            onClick={() => handleDeletePaper(paper.id)}
                          >
                            Delete
                          </button>
                          <div className="menu-divider"></div>
                          <div className="menu-header">Move to Folder</div>
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              className="menu-item"
                              onClick={() => handleMovePaper(paper.id, folder.id)}
                            >
                              {folder.name}
                            </button>
                          ))}
                          <div className="menu-divider"></div>
                          <button
                            className="menu-item new-folder"
                            onClick={() => {
                              const name = prompt('Folder name:');
                              if (name) {
                                const newId = nextFolderId;
                                setFolders((prev) => [...prev, { id: newId, name }]);
                                setNextFolderId((prev) => prev + 1);
                                handleMovePaper(paper.id, newId);
                              }
                            }}
                          >
                            + New Folder
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {sidebarActive === 'recent' && (
            <div className="papers-list">
              <div className="papers-header">Recent Papers ({visiblePapers.length}/10)</div>
              {visiblePapers.length === 0 ? (
                <div className="empty-state">No recent papers yet. Click on a paper link to add it to your recent list.</div>
              ) : (
                visiblePapers.map((paper, idx) => (
                  <div key={paper.id} className="paper-row">
                    <div className="paper-index">{idx + 1}</div>
                    <div className="paper-content">
                      <div className="paper-title">{paper.title}</div>
                      <div className="paper-details">
                        <span className="paper-authors">{paper.authors}</span>
                        <span className="paper-year">{paper.year}</span>
                        {paper.folder && (
                          <span className="paper-folder">
                            📁 {folders.find((f) => f.id === paper.folder)?.name || 'Unknown'}
                          </span>
                        )}
                        {paper.link && (
                          <a
                            href={paper.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="paper-link"
                            onClick={() => handlePaperClick(paper.id)}
                          >
                            Link
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="paper-menu-container">
                      <button
                        className="menu-button"
                        onClick={(e) => handleMenuOpen(paper.id, e)}
                      >
                        ☰
                      </button>
                      {menuOpen === paper.id && (
                        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="menu-item"
                            onClick={() => handleDeletePaper(paper.id)}
                          >
                            Delete
                          </button>
                          <div className="menu-divider"></div>
                          <div className="menu-header">Move to Folder</div>
                          {folders.map((folder) => (
                            <button
                              key={folder.id}
                              className="menu-item"
                              onClick={() => handleMovePaper(paper.id, folder.id)}
                            >
                              {folder.name}
                            </button>
                          ))}
                          <div className="menu-divider"></div>
                          <button
                            className="menu-item new-folder"
                            onClick={() => {
                              const name = prompt('Folder name:');
                              if (name) {
                                const newId = nextFolderId;
                                setFolders((prev) => [...prev, { id: newId, name }]);
                                setNextFolderId((prev) => prev + 1);
                                handleMovePaper(paper.id, newId);
                              }
                            }}
                          >
                            + New Folder
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
'use client';

// import './PersonalPage.css';
// client/src/pages/PersonalPage.tsx
// Main Personal Page component for displaying saved papers

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../components/Icon';
import { useSavedPapers } from '../lib/hooks/useSavedPapers';
import { useAuth } from '../lib/contexts/AuthContext';
import PaperCard from '../components/PaperCard';
import '../styles/PersonalPage.css';

export default function PersonalPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const {
    papers,
    folders,
    loading,
    error,
    selectedFolder,
    setSelectedFolder,
    toggleStar,
    removePaper,
    movePaperToFolder,
    createFolder,
    getFilteredPapers,
    getPaperCountForFolder,
    clearError,
  } = useSavedPapers();

  const [filterMode, setFilterMode] = useState<'all' | 'starred'>('all'); // 'all', 'starred'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showNewFolderModal, setShowNewFolderModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  // Get filtered and searched papers
  const getDisplayedPapers = () => {
    // Ensure papers is always an array
    if (!Array.isArray(papers)) {
      return [];
    }

    let filtered = getFilteredPapers(filterMode);

    // Handle undefined/null case (defensive programming)
    if (!Array.isArray(filtered)) {
      return [];
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(paper =>
        paper?.title?.toLowerCase().includes(query) ||
        paper?.authors?.some((author: string) => 
          author?.toLowerCase().includes(query)
        ) ||
        paper?.abstract?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const displayedPapers = getDisplayedPapers();

  // Handle new folder creation
  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderModal(false);
    } catch (err) {
      console.error('Failed to create folder:', err);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, navigate to login (local state is cleared)
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="personal-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your saved papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="personal-page">
      {/* Header: match Query page header style and remove sign-out button per UX request */}
      <header className="personal-page-header query-header">
        <div className="query-header-content">
          <div>
            <h1 className="query-title">My Saved Papers</h1>
          </div>
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={clearError} className="error-close">×</button>
        </div>
      )}

      <div className="personal-page-content">
        {/* Sidebar */}
        <aside className="sidebar">
          {/* Filters */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Filters</h3>
            <button
              className={`filter-btn ${filterMode === 'all' && !selectedFolder ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('all');
                setSelectedFolder(null);
              }}
            >
              <Icon name="clipboard" ariaLabel="All papers" />
              <span style={{ marginLeft: 8 }}>All Papers</span>
              <span className="filter-count">{Array.isArray(papers) ? papers.length : 0}</span>
            </button>
            <button
              className={`filter-btn ${filterMode === 'starred' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('starred');
                setSelectedFolder(null);
              }}
            >
              <Icon name="star" ariaLabel="Starred" />
              <span style={{ marginLeft: 8 }}>Starred</span>
              <span className="filter-count">
                {Array.isArray(papers) ? papers.filter(p => p?.starred).length : 0}
              </span>
            </button>
          </div>

          {/* Folders */}
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h3 className="sidebar-title">Folders</h3>
              <button
                className="icon-btn-small"
                onClick={() => setShowNewFolderModal(true)}
                title="Create folder"
              >
                +
              </button>
            </div>

            {folders.length === 0 ? (
              <p className="sidebar-empty">No folders yet</p>
            ) : (
              <div className="folder-list">
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    className={`filter-btn ${selectedFolder === folder.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      setFilterMode('all');
                    }}
                  >
                    <Icon name="folder" ariaLabel="Folder" />
                    <span style={{ marginLeft: 8 }}>{folder.name}</span>
                    <span className="filter-count">
                      {getPaperCountForFolder(folder.id)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="main-content">
          {/* Search bar */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search papers by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {/* Papers list */}
          {displayedPapers.length === 0 ? (
            <div className="empty-state">
              {!Array.isArray(papers) || papers.length === 0 ? (
                  <>
                    <div className="empty-icon"><Icon name="book" ariaLabel="No papers" /></div>
                    <h2>No papers saved yet</h2>
                    <p>Start exploring research papers and save them here for later!</p>
                  </>
                ) : searchQuery ? (
                  <>
                    <div className="empty-icon"><Icon name="search" ariaLabel="No results" /></div>
                    <h2>No papers found</h2>
                    <p>Try a different search term</p>
                  </>
                ) : (
                  <>
                    <div className="empty-icon"><Icon name="folder" ariaLabel="Empty folder" /></div>
                    <h2>No papers in this view</h2>
                    <p>Try selecting a different filter or folder</p>
                  </>
                )}
            </div>
          ) : (
            <div className="papers-list">
              {displayedPapers.map(paper => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onToggleStar={toggleStar}
                  onRemove={removePaper}
                  onMoveToFolder={movePaperToFolder}
                  folders={folders}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* New folder modal */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create New Folder</h2>
            <form onSubmit={handleCreateFolder}>
              <div className="modal-input-container">
                <input
                  type="text"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="modal-input"
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!newFolderName.trim()}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



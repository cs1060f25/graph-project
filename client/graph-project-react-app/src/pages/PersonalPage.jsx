// client/src/pages/PersonalPage.jsx
// Main Personal Page component for displaying saved papers

import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSavedPapers } from '../hooks/useSavedPapers';
import { useAuth } from '../context/AuthContext';
import PaperCard from '../components/PaperCard';
import './PersonalPage.css';

export default function PersonalPage() {
  const { logout, currentUser, loading: authLoading } = useAuth();

  // While auth is initializing, show spinner. No other hooks are used here.
  if (authLoading) {
    return (
      <div className="personal-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not signed in, kick to login (rendering null to avoid calling inner hooks).
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Auth is ready and user exists — now mount the inner component that uses other hooks
  return <PersonalPageContent logout={logout} />;
}

function PersonalPageContent({ logout, navigate }) {
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

  const [filterMode, setFilterMode] = useState('all'); // 'all', 'starred'
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  // Get filtered and searched papers
  const getDisplayedPapers = () => {
    let filtered = getFilteredPapers(filterMode);

    if (!filtered) return [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(paper =>
        paper.title.toLowerCase().includes(query) ||
        paper.authors?.some(author => author.toLowerCase().includes(query)) ||
        paper.abstract?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const displayedPapers = getDisplayedPapers();

  // Handle new folder creation
  const handleCreateFolder = async (e) => {
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
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  // Loading state for saved papers
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
      {/* Header */}
      <header className="personal-page-header">
        <div className="header-content">
          <div>
            <h1 className="page-title">My Saved Papers</h1>
            <p className="page-subtitle">
              {papers.length} {papers.length === 1 ? 'paper' : 'papers'} saved
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="logout-btn-header"
            disabled={loggingOut}
            title="Sign out"
          >
            {loggingOut ? '⏳' : '🚪'} Sign out
          </button>
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
              <span className="filter-icon">📄</span>
              All Papers
              <span className="filter-count">{papers.length}</span>
            </button>
            <button
              className={`filter-btn ${filterMode === 'starred' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('starred');
                setSelectedFolder(null);
              }}
            >
              <span className="filter-icon">⭐</span>
              Starred
              <span className="filter-count">
                {papers.filter(p => p.starred).length}
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
                    <span className="filter-icon">📁</span>
                    {folder.name}
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
              {papers.length === 0 ? (
                <>
                  <div className="empty-icon">📚</div>
                  <h2>No papers saved yet</h2>
                  <p>Start exploring research papers and save them here for later!</p>
                </>
              ) : searchQuery ? (
                <>
                  <div className="empty-icon">🔍</div>
                  <h2>No papers found</h2>
                  <p>Try a different search term</p>
                </>
              ) : (
                <>
                  <div className="empty-icon">📁</div>
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
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="modal-input"
                autoFocus
              />
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
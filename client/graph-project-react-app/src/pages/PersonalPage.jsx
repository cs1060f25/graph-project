// client/src/pages/PersonalPage.jsx
// Main Personal Page component for displaying saved papers

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useSavedPapers } from '../hooks/useSavedPapers';
import { useAuth } from '../context/AuthContext';
import PaperCard from '../components/PaperCard';
import './PersonalPage.css';

export default function PersonalPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
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
    deleteFolder,
    getFilteredPapers,
    getPaperCountForFolder,
    clearError,
    updateReadStatus,
  } = useSavedPapers();

  const [filterMode, setFilterMode] = useState('all'); // 'all', 'starred'
  const [searchQuery, setSearchQuery] = useState('');
  const [folderToDelete, setFolderToDelete] = useState(null);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [readStatusFilter, setReadStatusFilter] = useState('all'); // 'all', 'unread', 'reading', 'read'

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

    // Apply read status filter
    if (readStatusFilter !== 'all') {
      filtered = filtered.filter(p => {
        const status = p?.readStatus || 'unread';
        return status === readStatusFilter;
      });
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(paper =>
        paper?.title?.toLowerCase().includes(query) ||
        paper?.authors?.some(author => 
          author?.toLowerCase().includes(query)
        ) ||
        paper?.abstract?.toLowerCase().includes(query)
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

  const handleDeleteFolder = (folder) => {
    setFolderToDelete(folder);
    setShowDeleteFolderModal(true);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    try {
      await deleteFolder(folderToDelete.id);
      // Success! Close modal and clear state
      setShowDeleteFolderModal(false);
      setFolderToDelete(null);
    } catch (err) {
      // Error is already handled in useSavedPapers hook
      // Modal stays open so user can see the error and try again or cancel
      console.error('Failed to delete folder:', err);
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
      // Even if logout fails, navigate to login (local state is cleared)
      navigate('/login', { replace: true });
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

          {/* Reading Status Filters */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Reading Status</h3>
            <button
              className={`filter-btn ${readStatusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setReadStatusFilter('all')}
            >
              <span className="filter-icon">📚</span>
              <span style={{ marginLeft: 8 }}>All</span>
              <span className="filter-count">{Array.isArray(papers) ? papers.length : 0}</span>
            </button>
            <button
              className={`filter-btn ${readStatusFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setReadStatusFilter('unread')}
            >
              <span className="filter-icon">📄</span>
              <span style={{ marginLeft: 8 }}>Unread</span>
              <span className="filter-count">
                {Array.isArray(papers) ? papers.filter(p => !p?.readStatus || p?.readStatus === 'unread').length : 0}
              </span>
            </button>
            <button
              className={`filter-btn ${readStatusFilter === 'reading' ? 'active' : ''}`}
              onClick={() => setReadStatusFilter('reading')}
            >
              <span className="filter-icon">📖</span>
              <span style={{ marginLeft: 8 }}>Reading</span>
              <span className="filter-count">
                {Array.isArray(papers) ? papers.filter(p => p?.readStatus === 'reading').length : 0}
              </span>
            </button>
            <button
              className={`filter-btn ${readStatusFilter === 'read' ? 'active' : ''}`}
              onClick={() => setReadStatusFilter('read')}
            >
              <span className="filter-icon">✓</span>
              <span style={{ marginLeft: 8 }}>Read</span>
              <span className="filter-count">
                {Array.isArray(papers) ? papers.filter(p => p?.readStatus === 'read').length : 0}
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
              <div className="folders-list">
                {folders.map(folder => (
                  <div key={folder.id} className="folder-item">
                    <button
                      className={`filter-btn ${selectedFolder === folder.id ? 'active' : ''}`}
                      onClick={() => {
                        setFilterMode('folder');
                        setSelectedFolder(folder.id);
                      }}
                    >
                      <span className="filter-icon">📁</span>
                      <span className="folder-name">{folder.name}</span>
                      <span className="filter-count">
                        {getPaperCountForFolder(folder.id)}
                      </span>
                    </button>
                    <button
                      className="delete-folder-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder);
                      }}
                      title="Delete folder"
                      aria-label={`Delete folder ${folder.name}`}
                    >
                      🗑️
                    </button>
                  </div>
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
                  onUpdateReadStatus={updateReadStatus}
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

      {/* Delete Folder Confirmation Modal */}
      {showDeleteFolderModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteFolderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Folder</h2>
            <p>
              Are you sure you want to delete "<strong>{folderToDelete?.name}</strong>"?
            </p>
            <p className="warning-text">
              Papers in this folder will be moved to "All Papers". This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteFolderModal(false);
                  setFolderToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={confirmDeleteFolder}
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
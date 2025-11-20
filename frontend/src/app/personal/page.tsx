'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../components/Icon';
import PaperCard from '../../components/PaperCard';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSavedPapers,
  getFolders,
  createFolder,
  updatePaper,
  deletePaper,
  type Paper,
  type Folder,
} from '../../lib/api/user';

function filterPapers(
  papers: Paper[],
  filterMode: string,
  selectedFolder: string | null
): Paper[] {
  if (!Array.isArray(papers)) {
    return [];
  }

  let filtered = papers;

  if (filterMode === 'starred') {
    filtered = filtered.filter(p => p.starred);
  }

  if (selectedFolder) {
    filtered = filtered.filter(p => p.folderId === selectedFolder);
  }

  return filtered;
}

function searchPapers(papers: Paper[], query: string): Paper[] {
  if (!query.trim()) {
    return papers;
  }

  const searchTerm = query.toLowerCase();
  return papers.filter(paper =>
    paper.title?.toLowerCase().includes(searchTerm) ||
    paper.authors?.some(author => 
      author?.toLowerCase().includes(searchTerm)
    ) ||
    paper.abstract?.toLowerCase().includes(searchTerm)
  );
}

function getPaperCountForFolder(
  papers: Paper[],
  folderId: string
): number {
  return papers.filter(p => p.folderId === folderId).length;
}

export default function PersonalPage() {
  const { user, token, loading: authLoading } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'starred'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (token && !authLoading) {
      loadData();
    }
  }, [token, authLoading]);

  async function loadData() {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const [papersData, foldersData] = await Promise.all([
        getSavedPapers(token),
        getFolders(token),
      ]);
      setPapers(papersData || []);
      setFolders(foldersData || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load your papers and folders');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStar(paperId: string) {
    if (!token) return;
    
    const paper = papers.find(p => p.id === paperId);
    if (!paper) return;

    try {
      const updated = await updatePaper(token, paperId, {
        starred: !paper.starred,
      });
      setPapers(prev => prev.map(p => p.id === paperId ? updated : p));
    } catch (err: any) {
      console.error('Error toggling star:', err);
      setError(err.message || 'Failed to update paper');
    }
  }

  async function handleRemovePaper(paperId: string) {
    if (!token) return;
    
    try {
      await deletePaper(token, paperId);
      setPapers(prev => prev.filter(p => p.id !== paperId));
    } catch (err: any) {
      console.error('Error removing paper:', err);
      setError(err.message || 'Failed to remove paper');
    }
  }

  async function handleMovePaperToFolder(paperId: string, folderId: string | null) {
    if (!token) return;
    
    try {
      const updated = await updatePaper(token, paperId, {
        folderId: folderId,
      });
      setPapers(prev => prev.map(p => p.id === paperId ? updated : p));
    } catch (err: any) {
      console.error('Error moving paper:', err);
      setError(err.message || 'Failed to move paper');
    }
  }

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newFolderName.trim()) return;

    try {
      const newFolder = await createFolder(token, newFolderName.trim());
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowNewFolderModal(false);
    } catch (err: any) {
      console.error('Error creating folder:', err);
      setError(err.message || 'Failed to create folder');
    }
  }

  const displayedPapers = useMemo(() => {
    const filtered = filterPapers(papers, filterMode, selectedFolder);
    return searchPapers(filtered, searchQuery);
  }, [papers, filterMode, selectedFolder, searchQuery]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0f0f10] text-[#eaeaea]">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-10 h-10 border-4 border-[#2a2a2e] border-t-[#3a82ff] rounded-full animate-spin"></div>
          <p className="text-[#888] text-base">Loading your saved papers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f10] text-[#eaeaea]">
      <header className="bg-[#0f0f10] border-b border-[#2a2a2e] py-4">
        <div className="max-w-[1400px] mx-auto px-4">
          <h1 className="text-3xl font-semibold text-[#eaeaea] m-0">My Saved Papers</h1>
        </div>
      </header>

      {error && (
        <div className="bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.14)] text-[#dc2626] py-3 px-4 rounded-lg mx-6 my-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="bg-transparent border-none text-2xl cursor-pointer text-[#dc2626] p-0 w-6 h-6">×</button>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto p-6 grid grid-cols-[280px_1fr] gap-6">
        <aside className="bg-[#151517] rounded-xl p-5 h-fit border border-[#2a2a2e] sticky top-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wide m-0 mb-3">Filters</h3>
            <button
              className={`w-full flex items-center gap-3 py-2.5 px-3 bg-transparent border-none rounded-lg cursor-pointer text-[0.9375rem] text-[#eaeaea] transition-all mb-1 text-left hover:bg-[#1a1a1c] ${
                filterMode === 'all' && !selectedFolder ? 'bg-[rgba(58,130,255,0.12)] text-[#3a82ff] font-medium' : ''
              }`}
              onClick={() => {
                setFilterMode('all');
                setSelectedFolder(null);
              }}
            >
              <Icon name="book" ariaLabel="All papers" />
              <span>All Papers</span>
              <span className={`ml-auto text-sm text-[#888] bg-[#1a1a1c] py-0.5 px-2 rounded-xl font-medium ${
                filterMode === 'all' && !selectedFolder ? 'bg-[rgba(58,130,255,0.12)] text-[#3a82ff]' : ''
              }`}>
                {Array.isArray(papers) ? papers.length : 0}
              </span>
            </button>
            <button
              className={`w-full flex items-center gap-3 py-2.5 px-3 bg-transparent border-none rounded-lg cursor-pointer text-[0.9375rem] text-[#eaeaea] transition-all mb-1 text-left hover:bg-[#1a1a1c] ${
                filterMode === 'starred' ? 'bg-[rgba(58,130,255,0.12)] text-[#3a82ff] font-medium' : ''
              }`}
              onClick={() => {
                setFilterMode('starred');
                setSelectedFolder(null);
              }}
            >
              <Icon name="star" ariaLabel="Starred" />
              <span>Starred</span>
              <span className={`ml-auto text-sm text-[#888] bg-[#1a1a1c] py-0.5 px-2 rounded-xl font-medium ${
                filterMode === 'starred' ? 'bg-[rgba(58,130,255,0.12)] text-[#3a82ff]' : ''
              }`}>
                {Array.isArray(papers) ? papers.filter(p => p?.starred).length : 0}
              </span>
            </button>
          </div>

          <div className="mb-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-[#888] uppercase tracking-wide m-0">Folders</h3>
              <button
                className="bg-[#1a1a1c] border-none w-7 h-7 rounded-md cursor-pointer text-xl flex items-center justify-center transition-all hover:bg-[#151517]"
                onClick={() => setShowNewFolderModal(true)}
                title="Create folder"
              >
                +
              </button>
            </div>

            {folders.length === 0 ? (
              <p className="text-sm text-[#888] text-center py-3">No folders yet</p>
            ) : (
              <div>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    className={`w-full flex items-center gap-3 py-2.5 px-3 bg-transparent border-none rounded-lg cursor-pointer text-[0.9375rem] text-[#eaeaea] transition-all mb-1 text-left hover:bg-[#1a1a1c] ${
                      selectedFolder === folder.id ? 'bg-[rgba(58,130,255,0.12)] text-[#3a82ff] font-medium' : ''
                    }`}
                    onClick={() => {
                      setSelectedFolder(folder.id);
                      setFilterMode('all');
                    }}
                  >
                    <Icon name="folder" ariaLabel="Folder" />
                    <span>{folder.name}</span>
                    <span className={`ml-auto text-sm text-[#888] bg-[#1a1a1c] py-0.5 px-2 rounded-xl font-medium ${
                      selectedFolder === folder.id ? 'bg-[rgba(58,130,255,0.12)] text-[#3a82ff]' : ''
                    }`}>
                      {getPaperCountForFolder(papers, folder.id)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="min-h-[400px]">
          <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl py-3 px-4 mb-5 flex items-center gap-3">
            <input
              type="text"
              placeholder="Search papers by title, author, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none outline-none text-base text-[#eaeaea] bg-transparent placeholder:text-[#9ca3af]"
            />
            {searchQuery && (
              <button
                className="bg-transparent border-none text-2xl cursor-pointer text-[#9ca3af] p-0 w-6 h-6 flex items-center justify-center"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          {displayedPapers.length === 0 ? (
            <div className="bg-[#151517] border border-[#2a2a2e] rounded-xl py-16 px-10 text-center">
              {!Array.isArray(papers) || papers.length === 0 ? (
                <>
                  <div className="text-6xl mb-4"><Icon name="book" ariaLabel="No papers" /></div>
                  <h2 className="text-2xl font-semibold text-[#eaeaea] m-0 mb-2">No papers saved yet</h2>
                  <p className="text-base text-[#888] m-0">Start exploring research papers and save them here for later!</p>
                </>
              ) : searchQuery ? (
                <>
                  <div className="text-6xl mb-4"><Icon name="search" ariaLabel="No results" /></div>
                  <h2 className="text-2xl font-semibold text-[#eaeaea] m-0 mb-2">No papers found</h2>
                  <p className="text-base text-[#888] m-0">Try a different search term</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4"><Icon name="folder" ariaLabel="Empty folder" /></div>
                  <h2 className="text-2xl font-semibold text-[#eaeaea] m-0 mb-2">No papers in this view</h2>
                  <p className="text-base text-[#888] m-0">Try selecting a different filter or folder</p>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              {displayedPapers.map(paper => (
                <PaperCard
                  key={paper.id}
                  paper={paper}
                  onToggleStar={handleToggleStar}
                  onRemove={handleRemovePaper}
                  onMoveToFolder={handleMovePaperToFolder}
                  folders={folders}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {showNewFolderModal && (
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-[1000]" onClick={() => setShowNewFolderModal(false)}>
          <div className="bg-[#151517] rounded-xl p-6 max-w-[400px] w-[90%] shadow-[0_20px_40px_-8px_rgba(0,0,0,0.6)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-[#eaeaea] m-0 mb-5">Create New Folder</h2>
            <form onSubmit={handleCreateFolder}>
              <div className="bg-[#1a1a1c] border border-[#2a2a2e] rounded-xl py-2.5 px-3 mb-4">
                <input
                  type="text"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full py-2 border-none rounded-md text-base m-0 outline-none bg-transparent text-[#eaeaea] box-border focus:border-[#3a82ff]"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="py-2.5 px-5 border-none rounded-lg text-[0.9375rem] font-medium cursor-pointer transition-all bg-[#1a1a1c] text-[#eaeaea] hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 border-none rounded-lg text-[0.9375rem] font-medium cursor-pointer transition-all bg-[#3a82ff] text-white hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
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


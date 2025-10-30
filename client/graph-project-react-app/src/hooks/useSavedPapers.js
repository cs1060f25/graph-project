// client/src/hooks/useSavedPapers.js
// React hook for managing saved papers and folders

import { useState, useEffect, useCallback } from 'react';
import { userApi } from '../services/userApi';

/**
 * Custom hook for managing saved papers and folders
 * Handles fetching, creating, updating, and deleting papers and folders
 * 
 * @returns {Object} Papers state and methods
 */
export function useSavedPapers() {
  // State
  const [papers, setPapers] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFolder, setSelectedFolder] = useState(null); // null = all papers

  /**
   * Fetch papers and folders from API
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [papersData, foldersData] = await Promise.all([
        userApi.getSavedPapers(),
        userApi.getFolders(),
      ]);

      setPapers(papersData);
      setFolders(foldersData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load papers and folders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Toggle star status of a paper
   * @param {string} paperId - Paper ID
   */
  const toggleStar = useCallback(async (paperId) => {
    // Find the paper and save state for potential revert
    const paper = papers.find(p => p.id === paperId);
    if (!paper) return;

    const previousStarred = paper.starred;

    try {
      // Optimistic update
      setPapers(prev =>
        prev.map(p =>
          p.id === paperId ? { ...p, starred: !p.starred } : p
        )
      );

      // TODO: Implement updatePaper in backend
      // For now, this is just optimistic UI
      // await userApi.updatePaper(paperId, { starred: !paper.starred });

    } catch (err) {
      console.error('Error toggling star:', err);
      // Revert optimistic update using the saved value
      setPapers(prev =>
        prev.map(p =>
          p.id === paperId ? { ...p, starred: previousStarred } : p
        )
      );
      setError('Failed to update star status');
    }
  }, [papers]);

  /**
   * Remove a paper
   * @param {string} paperId - Paper ID
   */
  const removePaper = useCallback(async (paperId) => {
    // Save paper for potential revert
    const paperToRemove = papers.find(p => p.id === paperId);
    
    try {
      // Optimistic update
      setPapers(prev => prev.filter(p => p.id !== paperId));

      // TODO: Implement deletePaper in backend
      // await userApi.deletePaper(paperId);

    } catch (err) {
      console.error('Error removing paper:', err);
      // Revert optimistic update
      if (paperToRemove) {
        setPapers(prev => [...prev, paperToRemove]);
      }
      setError('Failed to remove paper');
    }
  }, [papers]);

  /**
   * Add a new paper
   * @param {Object} paperData - Paper data
   */
  const addPaper = useCallback(async (paperData) => {
    try {
      const newPaper = await userApi.savePaper(paperData);
      setPapers(prev => [newPaper, ...prev]);
      return newPaper;
    } catch (err) {
      console.error('Error adding paper:', err);
      setError('Failed to save paper');
      throw err;
    }
  }, []);

  /**
   * Move paper to a different folder
   * @param {string} paperId - Paper ID
   * @param {string} folderId - Folder ID (or null for no folder)
   */
  const movePaperToFolder = useCallback(async (paperId, folderId) => {
    // Save old folder ID for potential revert
    const paper = papers.find(p => p.id === paperId);
    const previousFolderId = paper?.folderId;
    
    try {
      // Optimistic update
      setPapers(prev =>
        prev.map(p =>
          p.id === paperId ? { ...p, folderId } : p
        )
      );

      // TODO: Implement updatePaper in backend
      // await userApi.updatePaper(paperId, { folderId });

    } catch (err) {
      console.error('Error moving paper:', err);
      // Revert optimistic update
      setPapers(prev =>
        prev.map(p =>
          p.id === paperId ? { ...p, folderId: previousFolderId } : p
        )
      );
      setError('Failed to move paper');
    }
  }, [papers]);

  /**
   * Create a new folder
   * @param {string} folderName - Folder name
   */
  const createFolder = useCallback(async (folderName) => {
    try {
      const newFolder = await userApi.createFolder(folderName);
      setFolders(prev => [...prev, newFolder]);
      return newFolder;
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
      throw err;
    }
  }, []);

  /**
   * Rename a folder
   * @param {string} folderId - Folder ID
   * @param {string} newName - New folder name
   */
  const renameFolder = useCallback(async (folderId, newName) => {
    // Save old name for potential revert
    const folder = folders.find(f => f.id === folderId);
    const previousName = folder?.name;
    
    try {
      // Optimistic update
      setFolders(prev =>
        prev.map(f =>
          f.id === folderId ? { ...f, name: newName } : f
        )
      );

      // TODO: Implement updateFolder in backend
      // await userApi.updateFolder(folderId, newName);

    } catch (err) {
      console.error('Error renaming folder:', err);
      // Revert optimistic update
      setFolders(prev =>
        prev.map(f =>
          f.id === folderId ? { ...f, name: previousName } : f
        )
      );
      setError('Failed to rename folder');
    }
  }, [folders]);

  /**
   * Delete a folder
   * @param {string} folderId - Folder ID
   */
  const deleteFolder = useCallback(async (folderId) => {
    // Save folder for potential revert
    const folderToDelete = folders.find(f => f.id === folderId);
    
    try {
      // Optimistic update
      setFolders(prev => prev.filter(f => f.id !== folderId));

      // Move papers in this folder to "no folder"
      setPapers(prev =>
        prev.map(p =>
          p.folderId === folderId ? { ...p, folderId: null } : p
        )
      );

      // TODO: Implement deleteFolder in backend
      // await userApi.deleteFolder(folderId);

    } catch (err) {
      console.error('Error deleting folder:', err);
      // Revert optimistic update
      if (folderToDelete) {
        setFolders(prev => [...prev, folderToDelete]);
      }
      setError('Failed to delete folder');
    }
  }, [folders]);

  /**
   * Get filtered papers based on selected folder or filter
   */
  const getFilteredPapers = useCallback((filter = 'all') => {
    let filtered = [...papers];

    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter(p => p.folderId === selectedFolder);
    }

    // Additional filters
    if (filter === 'starred') {
      filtered = filtered.filter(p => p.starred);
    }

    return filtered;
  }, [papers, selectedFolder]);

  /**
   * Get papers count for a specific folder
   */
  const getPaperCountForFolder = useCallback((folderId) => {
    return papers.filter(p => p.folderId === folderId).length;
  }, [papers]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    papers,
    folders,
    loading,
    error,
    selectedFolder,

    // Setters
    setSelectedFolder,

    // Paper actions
    toggleStar,
    removePaper,
    addPaper,
    movePaperToFolder,

    // Folder actions
    createFolder,
    renameFolder,
    deleteFolder,

    // Utility
    getFilteredPapers,
    getPaperCountForFolder,
    clearError,
    refreshData: fetchData,
  };
}

export default useSavedPapers;

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

      // Ensure papers and folders are always arrays, even if API returns undefined/null
      setPapers(Array.isArray(papersData) ? papersData : []);
      setFolders(Array.isArray(foldersData) ? foldersData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load papers and folders');
      // Ensure state is always valid arrays even on error
      setPapers([]);
      setFolders([]);
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
    // Ensure papers is an array
    if (!Array.isArray(papers)) {
      return;
    }
    // Find the paper and save state for potential revert
    const paper = papers.find(p => p?.id === paperId);
    if (!paper) return;

    const previousStarred = paper.starred;

    try {
      // Optimistic update
      setPapers(prev =>
        prev.map(p =>
          p.id === paperId ? { ...p, starred: !p.starred } : p
        )
      );

      // Update in backend
      const result = await userApi.updatePaper(paperId, { starred: !paper.starred });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update star status');
      }

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
    // Ensure papers is an array
    if (!Array.isArray(papers)) {
      return;
    }
    // Save paper for potential revert
    const paperToRemove = papers.find(p => p?.id === paperId);
    
    try {
      // Optimistic update
      setPapers(prev => prev.filter(p => p?.id !== paperId));

      // Delete from backend
      const result = await userApi.deletePaper(paperId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete paper');
      }

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
      const result = await userApi.savePaper(paperData);
      if (result.success && result.data) {
        setPapers(prev => [result.data, ...prev]);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to save paper');
      }
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
    // Ensure papers is an array
    if (!Array.isArray(papers)) {
      return;
    }
    // Save old folder ID for potential revert
    const paper = papers.find(p => p?.id === paperId);
    const previousFolderId = paper?.folderId;
    
    try {
      // Optimistic update
      setPapers(prev =>
        prev.map(p =>
          p.id === paperId ? { ...p, folderId } : p
        )
      );

      // Update in backend
      const result = await userApi.updatePaper(paperId, { folderId });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to move paper');
      }

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
    const result = await userApi.createFolder(folderName);
    
    // Check if result is null or undefined
    if (!result) {
      throw new Error('No response from server');
    }
    
    // Handle both response formats:
    let newFolder;
    
    if (result.success && result.data) {
      // Format 1: Wrapped response
      newFolder = result.data;
    } else if (result.id || result._id) {
      // Format 2: Direct folder object
      newFolder = result;
    } else {
      throw new Error(result.error || 'Failed to create folder');
    }
    
    // Add to local state
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
    // Ensure folders is an array
    if (!Array.isArray(folders)) {
      return;
    }
    // Save old name for potential revert
    const folder = folders.find(f => f?.id === folderId);
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
  // Ensure folders is an array
  if (!Array.isArray(folders)) {
    return;
  }
  
  // Save folder and affected papers for potential revert
  const folderToDelete = folders.find(f => f?.id === folderId);
  const affectedPapers = papers.filter(p => p?.folderId === folderId);
  
  try {
    // Optimistic update - remove folder from UI
    setFolders(prev => prev.filter(f => f.id !== folderId));
    
    // Optimistic update - move papers in this folder to "no folder"
    setPapers(prev =>
      prev.map(p =>
        p.folderId === folderId ? { ...p, folderId: null } : p
      )
    );
    
    // Delete from backend
    const result = await userApi.deleteFolder(folderId);
    
    // Check if result is null or undefined
    if (!result) {
      throw new Error('No response from server');
    }
    
    // Handle response format (check for success flag)
    if (result.success === false) {
      throw new Error(result.error || 'Failed to delete folder');
    }
    
    // If selectedFolder was the deleted folder, clear selection
    if (selectedFolder === folderId) {
      setSelectedFolder(null);
    }
    
    // Success! (no need to throw or show error)
    
  } catch (err) {
    console.error('Error deleting folder:', err);
    
    // Revert optimistic updates
    if (folderToDelete) {
      setFolders(prev => [...prev, folderToDelete]);
    }
    
    // Revert papers back to the deleted folder
    setPapers(prev =>
      prev.map(p => {
        const wasInDeletedFolder = affectedPapers.find(ap => ap.id === p.id);
        return wasInDeletedFolder ? { ...p, folderId: folderId } : p;
      })
    );
    
    setError('Failed to delete folder');
    throw err;
  }
}, [folders, papers, selectedFolder]);


  /**
   * Get filtered papers based on selected folder or filter
   */
  const getFilteredPapers = useCallback((filter = 'all') => {
    // Ensure papers is always an array
    if (!Array.isArray(papers)) {
      return [];
    }

    let filtered = [...papers];

    // Filter by folder
    if (selectedFolder) {
      filtered = filtered.filter(p => p?.folderId === selectedFolder);
    }

    // Additional filters
    if (filter === 'starred') {
      filtered = filtered.filter(p => p?.starred);
    }

    return filtered;
  }, [papers, selectedFolder]);

  /**
   * Get papers count for a specific folder
   */
  const getPaperCountForFolder = useCallback((folderId) => {
    if (!Array.isArray(papers)) {
      return 0;
    }
    return papers.filter(p => p?.folderId === folderId).length;
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

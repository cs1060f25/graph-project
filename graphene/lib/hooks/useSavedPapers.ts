import { useState, useEffect, useCallback } from 'react';
import { userApi, Paper, Folder } from '../services/userApi';

interface UseSavedPapersReturn {
  papers: Paper[];
  folders: Folder[];
  loading: boolean;
  error: string | null;
  selectedFolder: string | null;
  setSelectedFolder: (folderId: string | null) => void;
  toggleStar: (paperId: string) => Promise<void>;
  removePaper: (paperId: string) => Promise<void>;
  addPaper: (paperData: Omit<Paper, 'id'>) => Promise<Paper>;
  movePaperToFolder: (paperId: string, folderId: string | null) => Promise<void>;
  createFolder: (folderName: string) => Promise<Folder>;
  renameFolder: (folderId: string, newName: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  getFilteredPapers: (filter?: 'all' | 'starred') => Paper[];
  getPaperCountForFolder: (folderId: string) => number;
  clearError: () => void;
  refreshData: () => Promise<void>;
}

export function useSavedPapers(): UseSavedPapersReturn {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [papersData, foldersData] = await Promise.all([
        userApi.getSavedPapers(),
        userApi.getFolders(),
      ]);
      setPapers(Array.isArray(papersData) ? papersData : []);
      setFolders(Array.isArray(foldersData) ? foldersData : []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load papers and folders');
      setPapers([]);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleStar = useCallback(async (paperId: string) => {
    if (!Array.isArray(papers)) return;
    const paper = papers.find(p => p?.id === paperId);
    if (!paper) return;
    const previousStarred = paper.starred;

    try {
      setPapers(prev => prev.map(p => p.id === paperId ? { ...p, starred: !p.starred } : p));
      const result = await userApi.updatePaper(paperId, { starred: !paper.starred });
      if (!result.success) {
        throw new Error(result.error || 'Failed to update star status');
      }
    } catch (err) {
      console.error('Error toggling star:', err);
      setPapers(prev => prev.map(p => p.id === paperId ? { ...p, starred: previousStarred } : p));
      setError('Failed to update star status');
    }
  }, [papers]);

  const removePaper = useCallback(async (paperId: string) => {
    if (!Array.isArray(papers)) return;
    const paperToRemove = papers.find(p => p?.id === paperId);
    
    try {
      setPapers(prev => prev.filter(p => p?.id !== paperId));
      const result = await userApi.deletePaper(paperId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete paper');
      }
    } catch (err) {
      console.error('Error removing paper:', err);
      if (paperToRemove) {
        setPapers(prev => [...prev, paperToRemove]);
      }
      setError('Failed to remove paper');
    }
  }, [papers]);

  const addPaper = useCallback(async (paperData: Omit<Paper, 'id'>): Promise<Paper> => {
    try {
      const result = await userApi.savePaper(paperData);
      if (result.success && result.data) {
        setPapers(prev => [result.data!, ...prev]);
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

  const movePaperToFolder = useCallback(async (paperId: string, folderId: string | null) => {
    if (!Array.isArray(papers)) return;
    const paper = papers.find(p => p?.id === paperId);
    const previousFolderId = paper?.folderId;
    
    try {
      setPapers(prev => prev.map(p => p.id === paperId ? { ...p, folderId } : p));
      const result = await userApi.updatePaper(paperId, { folderId });
      if (!result.success) {
        throw new Error(result.error || 'Failed to move paper');
      }
    } catch (err) {
      console.error('Error moving paper:', err);
      setPapers(prev => prev.map(p => p.id === paperId ? { ...p, folderId: previousFolderId } : p));
      setError('Failed to move paper');
    }
  }, [papers]);

  const createFolder = useCallback(async (folderName: string): Promise<Folder> => {
    try {
      const result = await userApi.createFolder(folderName);
      if (result.success && result.data) {
        setFolders(prev => [...prev, result.data!]);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      setError('Failed to create folder');
      throw err;
    }
  }, []);

  const renameFolder = useCallback(async (folderId: string, newName: string) => {
    if (!Array.isArray(folders)) return;
    const folder = folders.find(f => f?.id === folderId);
    const previousName = folder?.name;
    
    try {
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: newName } : f));
      const result = await userApi.updateFolder(folderId, newName);
      if (!result.success) {
        throw new Error(result.error || 'Failed to rename folder');
      }
    } catch (err) {
      console.error('Error renaming folder:', err);
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name: previousName } : f));
      setError('Failed to rename folder');
    }
  }, [folders]);

  const deleteFolder = useCallback(async (folderId: string) => {
    if (!Array.isArray(folders)) return;
    const folderToDelete = folders.find(f => f?.id === folderId);
    
    try {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setPapers(prev => prev.map(p => p.folderId === folderId ? { ...p, folderId: null } : p));
      const result = await userApi.deleteFolder(folderId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete folder');
      }
    } catch (err) {
      console.error('Error deleting folder:', err);
      if (folderToDelete) {
        setFolders(prev => [...prev, folderToDelete]);
      }
      setError('Failed to delete folder');
    }
  }, [folders]);

  const getFilteredPapers = useCallback((filter: 'all' | 'starred' = 'all'): Paper[] => {
    if (!Array.isArray(papers)) return [];
    let filtered = [...papers];
    if (selectedFolder) {
      filtered = filtered.filter(p => p?.folderId === selectedFolder);
    }
    if (filter === 'starred') {
      filtered = filtered.filter(p => p?.starred);
    }
    return filtered;
  }, [papers, selectedFolder]);

  const getPaperCountForFolder = useCallback((folderId: string): number => {
    if (!Array.isArray(papers)) return 0;
    return papers.filter(p => p?.folderId === folderId).length;
  }, [papers]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    papers,
    folders,
    loading,
    error,
    selectedFolder,
    setSelectedFolder,
    toggleStar,
    removePaper,
    addPaper,
    movePaperToFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    getFilteredPapers,
    getPaperCountForFolder,
    clearError,
    refreshData: fetchData,
  };
}

export default useSavedPapers;

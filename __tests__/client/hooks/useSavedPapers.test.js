// client/src/hooks/useSavedPapers.test.js
// Unit tests for useSavedPapers hook

import { renderHook, act, waitFor } from '@testing-library/react';
import { useSavedPapers } from '../../../client/graph-project-react-app/src/hooks/useSavedPapers';
import * as userApi from '../../../client/graph-project-react-app/src/services/userApi';

// Mock the userApi module
jest.mock('../../../client/graph-project-react-app/src/services/userApi');

describe('useSavedPapers', () => {
  const mockPapers = [
    {
      id: '1',
      title: 'Paper 1',
      authors: ['Author 1'],
      link: 'https://example.com/1',
      starred: false,
      folderId: 'folder-1',
    },
    {
      id: '2',
      title: 'Paper 2',
      authors: ['Author 2'],
      link: 'https://example.com/2',
      starred: true,
      folderId: null,
    },
  ];

  const mockFolders = [
    { id: 'folder-1', name: 'Machine Learning' },
    { id: 'folder-2', name: 'Graph Theory' },
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    userApi.userApi.getSavedPapers = jest.fn().mockResolvedValue(mockPapers);
    userApi.userApi.getFolders = jest.fn().mockResolvedValue(mockFolders);
  });

  describe('initialization', () => {
    it('should fetch papers and folders on mount', async () => {
      const { result } = renderHook(() => useSavedPapers());

      // Initially loading
      expect(result.current.loading).toBe(true);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.papers).toEqual(mockPapers);
      expect(result.current.folders).toEqual(mockFolders);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      const errorMessage = 'Network error';
      userApi.userApi.getSavedPapers = jest
        .fn()
        .mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.papers).toEqual([]);
    });
  });

  describe('toggleStar', () => {
    it('should toggle star status optimistically', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const paperId = '1';
      const initialStarred = result.current.papers.find(
        (p) => p.id === paperId
      ).starred;

      act(() => {
        result.current.toggleStar(paperId);
      });

      // Should update immediately (optimistic)
      const updatedPaper = result.current.papers.find((p) => p.id === paperId);
      expect(updatedPaper.starred).toBe(!initialStarred);
    });

    it('should handle toggling non-existent paper', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should not throw error
      act(() => {
        result.current.toggleStar('non-existent-id');
      });

      expect(result.current.papers).toEqual(mockPapers);
    });
  });

  describe('removePaper', () => {
    it('should remove paper optimistically', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLength = result.current.papers.length;
      const paperIdToRemove = '1';

      act(() => {
        result.current.removePaper(paperIdToRemove);
      });

      expect(result.current.papers).toHaveLength(initialLength - 1);
      expect(result.current.papers.find((p) => p.id === paperIdToRemove)).toBeUndefined();
    });
  });

  describe('addPaper', () => {
    it('should add a new paper', async () => {
      const newPaper = {
        id: '3',
        title: 'New Paper',
        authors: ['New Author'],
        link: 'https://example.com/3',
      };

      userApi.userApi.savePaper = jest.fn().mockResolvedValue(newPaper);

      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLength = result.current.papers.length;

      await act(async () => {
        await result.current.addPaper(newPaper);
      });

      expect(result.current.papers).toHaveLength(initialLength + 1);
      expect(result.current.papers[0]).toEqual(newPaper);
    });
  });

  describe('createFolder', () => {
    it('should create a new folder', async () => {
      const newFolder = {
        id: 'folder-3',
        name: 'New Folder',
        createdAt: Date.now(),
      };

      userApi.userApi.createFolder = jest.fn().mockResolvedValue(newFolder);

      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialLength = result.current.folders.length;

      await act(async () => {
        await result.current.createFolder('New Folder');
      });

      expect(result.current.folders).toHaveLength(initialLength + 1);
      expect(result.current.folders[initialLength].name).toBe('New Folder');
    });
  });

  describe('getFilteredPapers', () => {
    it('should filter papers by folder', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSelectedFolder('folder-1');
      });

      const filtered = result.current.getFilteredPapers();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].folderId).toBe('folder-1');
    });

    it('should filter starred papers', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const starred = result.current.getFilteredPapers('starred');
      expect(starred.every((p) => p.starred)).toBe(true);
    });

    it('should return all papers when no filter', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const all = result.current.getFilteredPapers('all');
      expect(all).toHaveLength(mockPapers.length);
    });
  });

  describe('getPaperCountForFolder', () => {
    it('should return correct count for folder', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const count = result.current.getPaperCountForFolder('folder-1');
      expect(count).toBe(1);
    });

    it('should return 0 for empty folder', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const count = result.current.getPaperCountForFolder('folder-2');
      expect(count).toBe(0);
    });
  });

  describe('movePaperToFolder', () => {
    it('should move paper to different folder', async () => {
      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const paperId = '1';
      const newFolderId = 'folder-2';

      act(() => {
        result.current.movePaperToFolder(paperId, newFolderId);
      });

      const movedPaper = result.current.papers.find((p) => p.id === paperId);
      expect(movedPaper.folderId).toBe(newFolderId);
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      userApi.userApi.getSavedPapers = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useSavedPapers());

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
// client/src/__tests__/services/userApi.test.js
// Unit tests for userApi service

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { userApi } from '../../services/userApi';

// Mock Firebase auth - must be hoisted before imports
vi.mock('../../services/firebaseClient', () => {
  const mockGetIdToken = vi.fn().mockResolvedValue('mock-token');
  const mockCurrentUser = {
    getIdToken: mockGetIdToken,
  };
  
  return {
    auth: {
      get currentUser() {
        return mockCurrentUser;
      },
    },
  };
});

// Mock fetch globally
global.fetch = vi.fn();

describe('userApi', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getSavedPapers', () => {
    it('should fetch saved papers successfully', async () => {
      // Mock successful response
      const mockPapers = [
        { id: '1', title: 'Test Paper 1', authors: ['Author 1'] },
        { id: '2', title: 'Test Paper 2', authors: ['Author 2'] },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: async () => JSON.stringify({ success: true, data: mockPapers, error: null }),
        json: async () => ({ success: true, data: mockPapers, error: null }),
      });

      const result = await userApi.getSavedPapers();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/user/papers',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockPapers);
    });

    it('should handle errors when fetching papers fails', async () => {
      // Mock error response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: async () => JSON.stringify({ success: false, data: null, error: 'Server error' }),
        json: async () => ({ success: false, data: null, error: 'Server error' }),
      });

      await expect(userApi.getSavedPapers()).rejects.toThrow();
    });
  });

  describe('savePaper', () => {
    it('should save a new paper successfully', async () => {
      const newPaper = {
        title: 'New Paper',
        authors: ['New Author'],
        link: 'https://example.com/paper',
      };

      const mockResponse = {
        id: '123',
        ...newPaper,
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse, error: null }),
      });

      const result = await userApi.savePaper(newPaper);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/user/papers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newPaper),
        })
      );
      expect(result).toEqual({ success: true, data: mockResponse, error: null });
    });

    it('should validate required fields', async () => {
      const invalidPaper = {
        title: 'Paper without authors',
        // missing authors and link
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: async () => JSON.stringify({
          success: false,
          data: null,
          error: 'Missing required fields',
        }),
        json: async () => ({
          success: false,
          data: null,
          error: 'Missing required fields',
        }),
      });

      await expect(userApi.savePaper(invalidPaper)).rejects.toThrow();
    });
  });

  describe('getFolders', () => {
    it('should fetch folders successfully', async () => {
      const mockFolders = [
        { id: '1', name: 'Machine Learning' },
        { id: '2', name: 'Graph Theory' },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockFolders, error: null }),
      });

      const result = await userApi.getFolders();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/user/folders',
        expect.any(Object)
      );
      expect(result).toEqual(mockFolders);
      expect(result).toHaveLength(2);
    });
  });

  describe('createFolder', () => {
    it('should create a new folder successfully', async () => {
      const folderName = 'New Folder';
      const mockResponse = {
        id: 'folder-123',
        name: folderName,
        createdAt: Date.now(),
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse, error: null }),
      });

      const result = await userApi.createFolder(folderName);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5002/api/user/folders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: folderName }),
        })
      );
      expect(result).toEqual(mockResponse);
      expect(result.name).toBe(folderName);
    });

    it('should handle empty folder name', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
        text: async () => JSON.stringify({
          success: false,
          data: null,
          error: 'Folder name is required',
        }),
        json: async () => ({
          success: false,
          data: null,
          error: 'Folder name is required',
        }),
      });

      await expect(userApi.createFolder('')).rejects.toThrow();
    });
  });

});
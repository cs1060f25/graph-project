// client/src/services/userApi.test.js
// Unit tests for userApi service

import { userApi } from './userApi';

// Mock fetch globally
global.fetch = jest.fn();

describe('userApi', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    fetch.mockClear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getSavedPapers', () => {
    it('should fetch saved papers successfully', async () => {
      // Mock successful response
      const mockPapers = [
        { id: '1', title: 'Test Paper 1', authors: ['Author 1'] },
        { id: '2', title: 'Test Paper 2', authors: ['Author 2'] },
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockPapers, error: null }),
      });

      const result = await userApi.getSavedPapers();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/user/papers',
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
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
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

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse, error: null }),
      });

      const result = await userApi.savePaper(newPaper);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/user/papers',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newPaper),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should validate required fields', async () => {
      const invalidPaper = {
        title: 'Paper without authors',
        // missing authors and link
      };

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
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

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockFolders, error: null }),
      });

      const result = await userApi.getFolders();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/user/folders',
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

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockResponse, error: null }),
      });

      const result = await userApi.createFolder(folderName);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5001/api/user/folders',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: folderName }),
        })
      );
      expect(result.name).toBe(folderName);
    });

    it('should handle empty folder name', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          data: null,
          error: 'Folder name is required',
        }),
      });

      await expect(userApi.createFolder('')).rejects.toThrow();
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user info', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockUser, error: null }),
      });

      const result = await userApi.getCurrentUser();

      expect(result).toEqual(mockUser);
    });
  });
});
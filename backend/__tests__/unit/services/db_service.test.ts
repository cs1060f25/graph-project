import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as dbService from '../../../services/db_service.js';
import { db } from '../../../config/firebase.js';
import type { User, Folder, SavedPaper, QueryHistory } from '../../../models/db.js';

// Mock Firebase
vi.mock('../../../config/firebase.js', () => ({
  db: {
    collection: vi.fn(),
    batch: vi.fn(),
  },
  auth: {
    verifyIdToken: vi.fn(),
  },
}));

const mockDb = vi.mocked(db);

describe('DB Service - Unit Tests (Mocked)', () => {
  let mockDoc: any;
  let mockCollection: any;
  let mockBatch: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create subcollection mock that can be chained
    const createSubCollection = () => {
      const subCol = {
        doc: vi.fn(() => mockDoc),
        add: vi.fn(() => Promise.resolve({ id: 'new-id', ...mockDoc })),
        get: vi.fn(() => Promise.resolve({
          docs: [],
          empty: true,
        })),
        orderBy: vi.fn(function(this: any) { return this; }),
        limit: vi.fn(function(this: any) { return this; }),
        collection: vi.fn(() => createSubCollection()),
      };
      // Make orderBy and limit return the same object for chaining
      subCol.orderBy = vi.fn(() => subCol);
      subCol.limit = vi.fn(() => subCol);
      return subCol;
    };

    mockDoc = {
      exists: false,
      id: 'test-id',
      data: vi.fn(() => ({})),
      get: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      ref: {},
      collection: vi.fn(() => createSubCollection()),
    };

    mockCollection = {
      doc: vi.fn(() => mockDoc),
      add: vi.fn(() => Promise.resolve({ id: 'new-id', ...mockDoc })),
      get: vi.fn(() => Promise.resolve({
        docs: [],
        empty: true,
      })),
      orderBy: vi.fn(function(this: any) { return this; }),
      limit: vi.fn(function(this: any) { return this; }),
      collection: vi.fn(() => createSubCollection()),
    };

    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    };

    mockDb.collection.mockReturnValue(mockCollection as any);
    mockDb.batch.mockReturnValue(mockBatch as any);
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockDoc.set.mockResolvedValue(undefined);

      const result = await dbService.createUser('test-uid', 'test@example.com');

      expect(result.id).toBe('test-uid');
      expect(result.email).toBe('test@example.com');
      expect(mockCollection.doc).toHaveBeenCalledWith('test-uid');
      expect(mockDoc.set).toHaveBeenCalled();
    });

    it('should throw error for invalid uid', async () => {
      await expect(dbService.createUser('', 'test@example.com')).rejects.toThrow();
    });

    it('should throw error for invalid email', async () => {
      await expect(dbService.createUser('test-uid', '')).rejects.toThrow('Email is required');
    });

    it('should trim email', async () => {
      mockDoc.set.mockResolvedValue(undefined);

      await dbService.createUser('test-uid', '  test@example.com  ');

      const callArgs = mockDoc.set.mock.calls[0][0];
      expect(callArgs.email).toBe('test@example.com');
    });
  });

  describe('getUser', () => {
    it('should return user if exists', async () => {
      mockDoc.exists = true;
      mockDoc.data.mockReturnValue({
        email: 'test@example.com',
        createdAt: 1234567890,
        preferences: {},
      });
      mockDoc.get.mockResolvedValue(mockDoc);

      const result = await dbService.getUser('test-uid');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('test-id');
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if user does not exist', async () => {
      mockDoc.exists = false;
      mockDoc.get.mockResolvedValue(mockDoc);

      const result = await dbService.getUser('test-uid');

      expect(result).toBeNull();
    });

    it('should throw error for invalid uid', async () => {
      await expect(dbService.getUser('')).rejects.toThrow();
    });
  });

  describe('updateUserPreferences', () => {
    it('should update preferences successfully', async () => {
      mockDoc.update.mockResolvedValue(undefined);

      await dbService.updateUserPreferences('test-uid', { theme: 'dark' });

      expect(mockDoc.update).toHaveBeenCalledWith({ preferences: { theme: 'dark' } });
    });

    it('should throw error for invalid preferences', async () => {
      await expect(dbService.updateUserPreferences('test-uid', null as any)).rejects.toThrow();
    });
  });

  describe('createFolder', () => {
    it('should create folder successfully', async () => {
      const mockAddResult = { id: 'folder-123' };
      const subCollectionMock = {
        add: vi.fn(() => Promise.resolve(mockAddResult)),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.createFolder('test-uid', 'My Folder');

      expect(result.id).toBe('folder-123');
      expect(result.name).toBe('My Folder');
      expect(mockDoc.collection).toHaveBeenCalledWith('folders');
      expect(subCollectionMock.add).toHaveBeenCalled();
    });

    it('should trim folder name', async () => {
      const mockAddResult = { id: 'folder-123' };
      const subCollectionMock = {
        add: vi.fn(() => Promise.resolve(mockAddResult)),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      await dbService.createFolder('test-uid', '  My Folder  ');

      const callArgs = subCollectionMock.add.mock.calls[0][0];
      expect(callArgs.name).toBe('My Folder');
    });

    it('should throw error for invalid folder name', async () => {
      await expect(dbService.createFolder('test-uid', '')).rejects.toThrow();
    });
  });

  describe('getFolders', () => {
    it('should return folders successfully', async () => {
      const mockDocs = [
        { id: 'folder-1', data: () => ({ name: 'Folder 1', createdAt: 123 }) },
        { id: 'folder-2', data: () => ({ name: 'Folder 2', createdAt: 456 }) },
      ];
      const subCollectionMock = {
        get: vi.fn(() => Promise.resolve({ docs: mockDocs })),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.getFolders('test-uid');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('folder-1');
      expect(mockDoc.collection).toHaveBeenCalledWith('folders');
    });

    it('should return empty array if no folders', async () => {
      const subCollectionMock = {
        get: vi.fn(() => Promise.resolve({ docs: [] })),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.getFolders('test-uid');

      expect(result).toEqual([]);
    });
  });

  describe('updateFolder', () => {
    it('should update folder successfully', async () => {
      const folderDocMock = {
        exists: true,
        get: vi.fn(() => Promise.resolve(folderDocMock)),
        update: vi.fn(() => Promise.resolve()),
        data: vi.fn(() => ({ name: 'Updated Folder', createdAt: 123 })),
      };
      const subCollectionMock = {
        doc: vi.fn(() => folderDocMock),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.updateFolder('test-uid', 'folder-123', 'Updated Folder');

      expect(result.name).toBe('Updated Folder');
      expect(folderDocMock.update).toHaveBeenCalled();
    });

    it('should throw error if folder not found', async () => {
      const folderDocMock = {
        exists: false,
        get: vi.fn(() => Promise.resolve(folderDocMock)),
      };
      const subCollectionMock = {
        doc: vi.fn(() => folderDocMock),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      await expect(dbService.updateFolder('test-uid', 'folder-123', 'New Name')).rejects.toThrow('Folder not found');
    });
  });

  describe('deleteFolder', () => {
    it('should delete folder successfully', async () => {
      const folderDocMock = {
        exists: true,
        get: vi.fn(() => Promise.resolve(folderDocMock)),
        delete: vi.fn(() => Promise.resolve()),
      };
      const subCollectionMock = {
        doc: vi.fn(() => folderDocMock),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      await dbService.deleteFolder('test-uid', 'folder-123');

      expect(folderDocMock.delete).toHaveBeenCalled();
    });

    it('should throw error if folder not found', async () => {
      const folderDocMock = {
        exists: false,
        get: vi.fn(() => Promise.resolve(folderDocMock)),
      };
      const subCollectionMock = {
        doc: vi.fn(() => folderDocMock),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      await expect(dbService.deleteFolder('test-uid', 'folder-123')).rejects.toThrow('Folder not found');
    });
  });

  describe('createSavedPaper', () => {
    it('should create saved paper successfully', async () => {
      const mockAddResult = { id: 'paper-123' };
      const subCollectionMock = {
        add: vi.fn(() => Promise.resolve(mockAddResult)),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const paperData = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: 'https://example.com',
        summary: '',
        published: '2024-01-01',
        starred: false,
        folderId: null,
      };

      const result = await dbService.createSavedPaper('test-uid', paperData);

      expect(result.id).toBe('paper-123');
      expect(result.title).toBe('Test Paper');
      expect(result.starred).toBe(false);
      expect(result.folderId).toBeNull();
      expect(mockDoc.collection).toHaveBeenCalledWith('savedPapers');
    });

    it('should set default values', async () => {
      const mockAddResult = { id: 'paper-123' };
      const subCollectionMock = {
        add: vi.fn(() => Promise.resolve(mockAddResult)),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const paperData = {
        title: 'Test Paper',
        authors: ['Author One'],
        link: 'https://example.com',
        summary: '',
        published: '2024-01-01',
        starred: true,
        folderId: 'folder-123',
      };

      const result = await dbService.createSavedPaper('test-uid', paperData);

      expect(result.starred).toBe(true);
      expect(result.folderId).toBe('folder-123');
    });
  });

  describe('getSavedPapers', () => {
    it('should return papers ordered by createdAt desc', async () => {
      const mockDocs = [
        { id: 'paper-1', data: () => ({ title: 'Paper 1', createdAt: 200 }) },
        { id: 'paper-2', data: () => ({ title: 'Paper 2', createdAt: 100 }) },
      ];
      const orderedCollection = {
        get: vi.fn(() => Promise.resolve({ docs: mockDocs })),
      };
      const subCollectionMock = {
        orderBy: vi.fn(() => orderedCollection),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.getSavedPapers('test-uid');

      expect(result).toHaveLength(2);
      expect(subCollectionMock.orderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });
  });

  describe('updateSavedPaper', () => {
    it('should update paper successfully', async () => {
      const paperDocMock = {
        exists: true,
        get: vi.fn(() => Promise.resolve(paperDocMock)),
        update: vi.fn(() => Promise.resolve()),
        data: vi.fn(() => ({
          title: 'Updated Paper',
          authors: ['Author'],
          link: 'https://example.com',
          createdAt: 123,
          updatedAt: 456,
        })),
      };
      const subCollectionMock = {
        doc: vi.fn(() => paperDocMock),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.updateSavedPaper('test-uid', 'paper-123', { title: 'Updated Paper' });

      expect(result.title).toBe('Updated Paper');
      expect(paperDocMock.update).toHaveBeenCalled();
    });

    it('should throw error if paper not found', async () => {
      const paperDocMock = {
        exists: false,
        get: vi.fn(() => Promise.resolve(paperDocMock)),
      };
      const subCollectionMock = {
        doc: vi.fn(() => paperDocMock),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      await expect(dbService.updateSavedPaper('test-uid', 'paper-123', { title: 'New' })).rejects.toThrow('Paper not found');
    });

    it('should validate update data', async () => {
      await expect(dbService.updateSavedPaper('test-uid', 'paper-123', {})).rejects.toThrow();
    });
  });

  describe('deleteSavedPaper', () => {
    it('should delete paper successfully', async () => {
      const paperDocMock = {
        exists: true,
        get: vi.fn(() => Promise.resolve(paperDocMock)),
        delete: vi.fn(() => Promise.resolve()),
      };
      const subCollectionMock = {
        doc: vi.fn(() => paperDocMock),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      await dbService.deleteSavedPaper('test-uid', 'paper-123');

      expect(paperDocMock.delete).toHaveBeenCalled();
    });

    it('should throw error if paper not found', async () => {
      const paperDocMock = {
        exists: false,
        get: vi.fn(() => Promise.resolve(paperDocMock)),
      };
      const subCollectionMock = {
        doc: vi.fn(() => paperDocMock),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      await expect(dbService.deleteSavedPaper('test-uid', 'paper-123')).rejects.toThrow('Paper not found');
    });
  });

  describe('addQueryHistory', () => {
    it('should add query history successfully', async () => {
      const mockAddResult = { id: 'history-123' };
      const subCollectionMock = {
        add: vi.fn(() => Promise.resolve(mockAddResult)),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const queryData = {
        query: 'test query',
        type: 'keyword',
        resultCount: 10,
      };

      const result = await dbService.addQueryHistory('test-uid', queryData);

      expect(result.id).toBe('history-123');
      expect(result.query).toBe('test query');
      expect(result.type).toBe('keyword');
      expect(result.resultCount).toBe(10);
      expect(mockDoc.collection).toHaveBeenCalledWith('queryHistory');
    });

    it('should set default values', async () => {
      const mockAddResult = { id: 'history-123' };
      const subCollection = mockDoc.collection();
      subCollection.add.mockResolvedValue(mockAddResult);

      const queryData = {
        query: 'test query',
        type: 'keyword',
        resultCount: 0,
      };

      const result = await dbService.addQueryHistory('test-uid', queryData);

      expect(result.type).toBe('keyword');
      expect(result.resultCount).toBe(0);
    });
  });

  describe('getQueryHistory', () => {
    it('should return query history ordered by timestamp desc', async () => {
      const mockDocs = [
        { id: 'history-1', data: () => ({ query: 'Query 1', timestamp: 200 }) },
        { id: 'history-2', data: () => ({ query: 'Query 2', timestamp: 100 }) },
      ];
      const limitedCollection = {
        get: vi.fn(() => Promise.resolve({ docs: mockDocs })),
      };
      const orderedCollection = {
        limit: vi.fn(() => limitedCollection),
      };
      const subCollectionMock = {
        orderBy: vi.fn(() => orderedCollection),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.getQueryHistory('test-uid', 20);

      expect(result).toHaveLength(2);
      expect(subCollectionMock.orderBy).toHaveBeenCalledWith('timestamp', 'desc');
      expect(orderedCollection.limit).toHaveBeenCalledWith(20);
    });

    it('should throw error for invalid limit', async () => {
      await expect(dbService.getQueryHistory('test-uid', 0)).rejects.toThrow();
    });
  });

  describe('clearQueryHistory', () => {
    it('should clear all query history', async () => {
      const mockDocs = [
        { id: 'history-1', ref: {} },
        { id: 'history-2', ref: {} },
      ];
      const subCollectionMock = {
        get: vi.fn(() => Promise.resolve({ docs: mockDocs, empty: false })),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.clearQueryHistory('test-uid');

      expect(result).toBe(2);
      expect(mockBatch.delete).toHaveBeenCalledTimes(2);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should return 0 if no history', async () => {
      mockCollection.get.mockResolvedValue({ docs: [], empty: true });

      const result = await dbService.clearQueryHistory('test-uid');

      expect(result).toBe(0);
    });

    it('should handle large limit values', async () => {
      const mockDocs = Array(100).fill(null).map((_, i) => ({
        id: `history-${i}`,
        data: () => ({ query: `Query ${i}`, timestamp: i }),
      }));
      const limitedCollection = {
        get: vi.fn(() => Promise.resolve({ docs: mockDocs })),
      };
      const orderedCollection = {
        limit: vi.fn(() => limitedCollection),
      };
      const subCollectionMock = {
        orderBy: vi.fn(() => orderedCollection),
      };
      mockDoc.collection.mockReturnValue(subCollectionMock as any);

      const result = await dbService.getQueryHistory('test-uid', 1000);

      expect(result).toHaveLength(100);
      expect(orderedCollection.limit).toHaveBeenCalledWith(1000);
    });
  });

  describe('updateSavedPaper validation', () => {
    it('should validate title type', async () => {
      mockDoc.exists = true;
      mockDoc.get.mockResolvedValue(mockDoc);

      await expect(
        dbService.updateSavedPaper('test-uid', 'paper-123', { title: 123 as any })
      ).rejects.toThrow('title must be a non-empty string');
    });

    it('should validate authors type', async () => {
      mockDoc.exists = true;
      mockDoc.get.mockResolvedValue(mockDoc);

      await expect(
        dbService.updateSavedPaper('test-uid', 'paper-123', { authors: 'not an array' as any })
      ).rejects.toThrow('authors must be a non-empty array');
    });

    it('should validate link type', async () => {
      mockDoc.exists = true;
      mockDoc.get.mockResolvedValue(mockDoc);

      await expect(
        dbService.updateSavedPaper('test-uid', 'paper-123', { link: 123 as any })
      ).rejects.toThrow('link must be a non-empty string');
    });

    it('should validate similarity type', async () => {
      mockDoc.exists = true;
      mockDoc.get.mockResolvedValue(mockDoc);

      await expect(
        dbService.updateSavedPaper('test-uid', 'paper-123', { similarity: '0.85' as any })
      ).rejects.toThrow('similarity must be a number');
    });
  });
});


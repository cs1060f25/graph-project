import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QuerySnapshot,
  WriteBatch,
} from 'firebase-admin/firestore';
import {
  createUser,
  getUser,
  updateUserPreferences,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  createSavedPaper,
  getSavedPapers,
  updateSavedPaper,
  deleteSavedPaper,
  addQueryHistory,
  getQueryHistory,
  clearQueryHistory,
} from '../../../services/db_service.js';
import type { User, Folder, SavedPaper, QueryHistory } from '../../../models/db.js';

// Use vi.hoisted() to define mocks that can be used in vi.mock factory
const {
  mockDoc,
  mockGet,
  mockSet,
  mockAdd,
  mockUpdate,
  mockDelete,
  mockOrderBy,
  mockBatch,
  mockCommit,
  mockCollection,
} = vi.hoisted(() => {
  const mockDoc = vi.fn();
  const mockGet = vi.fn();
  const mockSet = vi.fn();
  const mockAdd = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockOrderBy = vi.fn(() => ({
    get: mockGet,
    limit: vi.fn(() => ({
      get: mockGet,
    })),
  }));
  const mockCommit = vi.fn();
  const mockBatch = vi.fn(() => ({
    delete: vi.fn(),
    commit: mockCommit,
  }));
  const mockCollection = vi.fn(() => ({
    doc: mockDoc,
    get: mockGet,
    add: mockAdd,
    orderBy: mockOrderBy,
  }));

  return {
    mockDoc,
    mockGet,
    mockSet,
    mockAdd,
    mockUpdate,
    mockDelete,
    mockOrderBy,
    mockBatch,
    mockCommit,
    mockCollection,
  };
});

vi.mock('../../../config/firebase.js', () => {
  return {
    db: {
      collection: mockCollection,
      batch: mockBatch,
    },
  };
});

describe('db_service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Operations', () => {
    describe('createUser', () => {
      it('should create a new user successfully', async () => {
        const uid = 'test-uid';
        const email = 'test@example.com';
        const mockUserRef = {
          set: mockSet,
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockSet.mockResolvedValue(undefined);

        const result = await createUser(uid, email);

        expect(mockCollection).toHaveBeenCalledWith('users');
        expect(mockDoc).toHaveBeenCalledWith(uid);
        expect(mockSet).toHaveBeenCalledWith({
          email: 'test@example.com',
          createdAt: expect.any(Number),
          preferences: {},
        });
        expect(result).toEqual({
          id: uid,
          email: 'test@example.com',
          createdAt: expect.any(Number),
          preferences: {},
        });
      });

      it('should trim email', async () => {
        const uid = 'test-uid';
        const email = '  test@example.com  ';
        const mockUserRef = {
          set: mockSet,
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockSet.mockResolvedValue(undefined);

        await createUser(uid, email);

        expect(mockSet).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
          })
        );
      });

      it('should throw error for invalid uid', async () => {
        await expect(createUser('', 'test@example.com')).rejects.toThrow(
          'User ID is required'
        );
      });

      it('should throw error for invalid email', async () => {
        await expect(createUser('test-uid', '')).rejects.toThrow(
          'Email is required'
        );
      });
    });

    describe('getUser', () => {
      it('should get user successfully', async () => {
        const uid = 'test-uid';
        const mockUserData = {
          email: 'test@example.com',
          createdAt: 1234567890,
          preferences: { theme: 'dark' },
        };
        const mockUserDoc = {
          exists: true,
          id: uid,
          data: () => mockUserData,
        } as unknown as DocumentSnapshot;
        const mockUserRef = {
          get: mockGet,
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockUserDoc);

        const result = await getUser(uid);

        expect(mockCollection).toHaveBeenCalledWith('users');
        expect(mockDoc).toHaveBeenCalledWith(uid);
        expect(result).toEqual({
          id: uid,
          ...mockUserData,
        });
      });

      it('should return null if user does not exist', async () => {
        const uid = 'test-uid';
        const mockUserDoc = {
          exists: false,
        } as unknown as DocumentSnapshot;
        const mockUserRef = {
          get: mockGet,
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockUserDoc);

        const result = await getUser(uid);

        expect(result).toBeNull();
      });

      it('should throw error for invalid uid', async () => {
        await expect(getUser('')).rejects.toThrow('User ID is required');
      });
    });

    describe('updateUserPreferences', () => {
      it('should update user preferences successfully', async () => {
        const uid = 'test-uid';
        const preferences = { theme: 'dark', language: 'en' };
        const mockUserRef = {
          update: mockUpdate,
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockUpdate.mockResolvedValue(undefined);

        await updateUserPreferences(uid, preferences);

        expect(mockCollection).toHaveBeenCalledWith('users');
        expect(mockDoc).toHaveBeenCalledWith(uid);
        expect(mockUpdate).toHaveBeenCalledWith({ preferences });
      });

      it('should throw error for invalid preferences', async () => {
        await expect(
          updateUserPreferences('test-uid', null as any)
        ).rejects.toThrow('Preferences must be an object');
      });

      it('should throw error for invalid uid', async () => {
        await expect(
          updateUserPreferences('', { theme: 'dark' })
        ).rejects.toThrow('User ID is required');
      });
    });
  });

  describe('Folder Operations', () => {
    describe('createFolder', () => {
      it('should create a folder successfully', async () => {
        const uid = 'test-uid';
        const folderName = 'My Folder';
        const folderId = 'folder-id-123';
        const mockFoldersCollection = {
          add: mockAdd,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockFoldersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockAdd.mockResolvedValue({
          id: folderId,
        });

        const result = await createFolder(uid, folderName);

        expect(mockCollection).toHaveBeenCalledWith('users');
        expect(mockDoc).toHaveBeenCalledWith(uid);
        expect(mockAdd).toHaveBeenCalledWith({
          name: 'My Folder',
          createdAt: expect.any(Number),
        });
        expect(result).toEqual({
          id: folderId,
          name: 'My Folder',
          createdAt: expect.any(Number),
        });
      });

      it('should trim folder name', async () => {
        const uid = 'test-uid';
        const folderName = '  My Folder  ';
        const folderId = 'folder-id-123';
        const mockFoldersCollection = {
          add: mockAdd,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockFoldersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockAdd.mockResolvedValue({
          id: folderId,
        });

        await createFolder(uid, folderName);

        expect(mockAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Folder',
          })
        );
      });

      it('should throw error for invalid folder name', async () => {
        await expect(createFolder('test-uid', '')).rejects.toThrow(
          'Folder name is required'
        );
      });

      it('should throw error for folder name exceeding 100 characters', async () => {
        const longName = 'a'.repeat(101);
        await expect(createFolder('test-uid', longName)).rejects.toThrow(
          'Folder name cannot exceed 100 characters'
        );
      });
    });

    describe('getFolders', () => {
      it('should get all folders successfully', async () => {
        const uid = 'test-uid';
        const mockFolders = [
          {
            id: 'folder-1',
            name: 'Folder 1',
            createdAt: 1234567890,
          },
          {
            id: 'folder-2',
            name: 'Folder 2',
            createdAt: 1234567891,
          },
        ];
        const mockQuerySnapshot = {
          docs: mockFolders.map((folder) => ({
            id: folder.id,
            data: () => ({
              name: folder.name,
              createdAt: folder.createdAt,
            }),
          })),
        } as unknown as QuerySnapshot;
        const mockFoldersCollection = {
          get: mockGet,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockFoldersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockQuerySnapshot);

        const result = await getFolders(uid);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          id: 'folder-1',
          name: 'Folder 1',
          createdAt: 1234567890,
        });
        expect(result[1]).toEqual({
          id: 'folder-2',
          name: 'Folder 2',
          createdAt: 1234567891,
        });
      });

      it('should return empty array if no folders exist', async () => {
        const uid = 'test-uid';
        const mockQuerySnapshot = {
          docs: [],
        } as unknown as QuerySnapshot;
        const mockFoldersCollection = {
          get: mockGet,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockFoldersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockQuerySnapshot);

        const result = await getFolders(uid);

        expect(result).toEqual([]);
      });
    });

    describe('updateFolder', () => {
      it('should update folder name successfully', async () => {
        const uid = 'test-uid';
        const folderId = 'folder-id-123';
        const newName = 'Updated Folder Name';
        const mockFolderDoc = {
          exists: true,
          id: folderId,
          data: () => ({
            name: 'Old Name',
            createdAt: 1234567890,
          }),
        } as unknown as DocumentSnapshot;
        const mockFolderRef = {
          get: mockGet,
          update: mockUpdate,
        };
        const mockFoldersCollection = {
          doc: vi.fn(() => mockFolderRef),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockFoldersCollection),
        };
        const updatedFolderDoc = {
          exists: true,
          id: folderId,
          data: () => ({
            name: newName,
            createdAt: 1234567890,
          }),
        } as unknown as DocumentSnapshot;
        mockDoc.mockReturnValue(mockUserRef);
        mockGet
          .mockResolvedValueOnce(mockFolderDoc)
          .mockResolvedValueOnce(updatedFolderDoc);
        mockUpdate.mockResolvedValue(undefined);

        const result = await updateFolder(uid, folderId, newName);

        expect(mockUpdate).toHaveBeenCalledWith({
          name: 'Updated Folder Name',
        });
        expect(result.name).toBe(newName);
      });

      it('should throw error if folder does not exist', async () => {
        const uid = 'test-uid';
        const folderId = 'folder-id-123';
        const mockFolderDoc = {
          exists: false,
        } as unknown as DocumentSnapshot;
        const mockFolderRef = {
          get: mockGet,
        };
        const mockFoldersCollection = {
          doc: vi.fn(() => mockFolderRef),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockFoldersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockFolderDoc);

        await expect(
          updateFolder(uid, folderId, 'New Name')
        ).rejects.toThrow('Folder not found');
      });
    });

    describe('deleteFolder', () => {
      it('should delete folder successfully', async () => {
        const uid = 'test-uid';
        const folderId = 'folder-id-123';
        const mockFolderDoc = {
          exists: true,
        } as unknown as DocumentSnapshot;
        const mockFolderRef = {
          get: mockGet,
          delete: mockDelete,
        };
        const mockFoldersCollection = {
          doc: vi.fn(() => mockFolderRef),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockFoldersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockFolderDoc);
        mockDelete.mockResolvedValue(undefined);

        await deleteFolder(uid, folderId);

        expect(mockDelete).toHaveBeenCalled();
      });

      it('should throw error if folder does not exist', async () => {
        const uid = 'test-uid';
        const folderId = 'folder-id-123';
        const mockFolderDoc = {
          exists: false,
        } as unknown as DocumentSnapshot;
        const mockFolderRef = {
          get: mockGet,
        };
        const mockFoldersCollection = {
          doc: vi.fn(() => mockFolderRef),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockFoldersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockFolderDoc);

        await expect(deleteFolder(uid, folderId)).rejects.toThrow(
          'Folder not found'
        );
      });
    });
  });

  describe('Saved Paper Operations', () => {
    describe('createSavedPaper', () => {
      it('should create a saved paper successfully', async () => {
        const uid = 'test-uid';
        const paperData = {
          title: 'Test Paper',
          summary: 'Test summary',
          published: '2024-01-01',
          authors: ['Author 1', 'Author 2'],
          link: 'https://example.com/paper',
          source: 'arxiv',
          starred: false,
          folderId: null,
        };
        const paperId = 'paper-id-123';
        const mockPapersCollection = {
          add: mockAdd,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockPapersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockAdd.mockResolvedValue({
          id: paperId,
        });

        const result = await createSavedPaper(uid, paperData);

        expect(mockAdd).toHaveBeenCalledWith({
          ...paperData,
          starred: false,
          folderId: null,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        });
        expect(result).toEqual({
          id: paperId,
          ...paperData,
          starred: false,
          folderId: null,
          createdAt: expect.any(Number),
          updatedAt: expect.any(Number),
        });
      });

      it('should use provided starred and folderId values', async () => {
        const uid = 'test-uid';
        const paperData = {
          title: 'Test Paper',
          summary: 'Test summary',
          published: '2024-01-01',
          authors: ['Author 1'],
          link: 'https://example.com/paper',
          starred: true,
          folderId: 'folder-123',
        };
        const paperId = 'paper-id-123';
        const mockPapersCollection = {
          add: mockAdd,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockPapersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockAdd.mockResolvedValue({
          id: paperId,
        });

        await createSavedPaper(uid, paperData);

        expect(mockAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            starred: true,
            folderId: 'folder-123',
          })
        );
      });

      it('should throw error for invalid paper data', async () => {
        await expect(
          createSavedPaper('test-uid', {
            title: '',
            authors: [],
            link: 'https://example.com',
          } as any)
        ).rejects.toThrow();
      });
    });

    describe('getSavedPapers', () => {
      it('should get all saved papers successfully', async () => {
        const uid = 'test-uid';
        const mockPapers = [
          {
            id: 'paper-1',
            title: 'Paper 1',
            summary: 'Summary 1',
            published: '2024-01-01',
            authors: ['Author 1'],
            link: 'https://example.com/1',
            starred: false,
            folderId: null,
            createdAt: 1234567890,
            updatedAt: 1234567890,
          },
        ];
        const mockQuerySnapshot = {
          docs: mockPapers.map((paper) => ({
            id: paper.id,
            data: () => ({
              title: paper.title,
              summary: paper.summary,
              published: paper.published,
              authors: paper.authors,
              link: paper.link,
              starred: paper.starred,
              folderId: paper.folderId,
              createdAt: paper.createdAt,
              updatedAt: paper.updatedAt,
            }),
          })),
        } as unknown as QuerySnapshot;
        const mockPapersCollection = {
          orderBy: mockOrderBy,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockPapersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockQuerySnapshot);

        const result = await getSavedPapers(uid);

        expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          id: 'paper-1',
          title: 'Paper 1',
          summary: 'Summary 1',
          published: '2024-01-01',
          authors: ['Author 1'],
          link: 'https://example.com/1',
          starred: false,
          folderId: null,
          createdAt: 1234567890,
          updatedAt: 1234567890,
        });
      });
    });

    describe('updateSavedPaper', () => {
      it('should update saved paper successfully', async () => {
        const uid = 'test-uid';
        const paperId = 'paper-id-123';
        const updateData = {
          starred: true,
          folderId: 'folder-123',
        };
        const mockPaperDoc = {
          exists: true,
          id: paperId,
          data: () => ({
            title: 'Original Title',
            summary: 'Original Summary',
            published: '2024-01-01',
            authors: ['Author 1'],
            link: 'https://example.com',
            starred: false,
            folderId: null,
            createdAt: 1234567890,
            updatedAt: 1234567890,
          }),
        } as unknown as DocumentSnapshot;
        const mockPaperRef = {
          get: mockGet,
          update: mockUpdate,
        };
        const mockPapersCollection = {
          doc: vi.fn(() => mockPaperRef),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockPapersCollection),
        };
        const updatedPaperDoc = {
          exists: true,
          id: paperId,
          data: () => ({
            title: 'Original Title',
            summary: 'Original Summary',
            published: '2024-01-01',
            authors: ['Author 1'],
            link: 'https://example.com',
            starred: true,
            folderId: 'folder-123',
            createdAt: 1234567890,
            updatedAt: 1234567891,
          }),
        } as unknown as DocumentSnapshot;
        mockDoc.mockReturnValue(mockUserRef);
        mockGet
          .mockResolvedValueOnce(mockPaperDoc)
          .mockResolvedValueOnce(updatedPaperDoc);
        mockUpdate.mockResolvedValue(undefined);

        const result = await updateSavedPaper(uid, paperId, updateData);

        expect(mockUpdate).toHaveBeenCalledWith({
          ...updateData,
          updatedAt: expect.any(Number),
        });
        expect(result.starred).toBe(true);
        expect(result.folderId).toBe('folder-123');
      });

      it('should throw error if paper does not exist', async () => {
        const uid = 'test-uid';
        const paperId = 'paper-id-123';
        const mockPaperDoc = {
          exists: false,
        } as unknown as DocumentSnapshot;
        const mockPaperRef = {
          get: mockGet,
        };
        const mockPapersCollection = {
          doc: vi.fn(() => mockPaperRef),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockPapersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockPaperDoc);

        await expect(
          updateSavedPaper(uid, paperId, { starred: true })
        ).rejects.toThrow('Paper not found');
      });

      it('should throw error if no valid fields provided', async () => {
        await expect(
          updateSavedPaper('test-uid', 'paper-id', { invalidField: 'value' } as any)
        ).rejects.toThrow('At least one of the following fields must be provided');
      });
    });

    describe('deleteSavedPaper', () => {
      it('should delete saved paper successfully', async () => {
        const uid = 'test-uid';
        const paperId = 'paper-id-123';
        const mockPaperDoc = {
          exists: true,
        } as unknown as DocumentSnapshot;
        const mockPaperRef = {
          get: mockGet,
          delete: mockDelete,
        };
        const mockPapersCollection = {
          doc: vi.fn(() => mockPaperRef),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockPapersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockPaperDoc);
        mockDelete.mockResolvedValue(undefined);

        await deleteSavedPaper(uid, paperId);

        expect(mockDelete).toHaveBeenCalled();
      });

      it('should throw error if paper does not exist', async () => {
        const uid = 'test-uid';
        const paperId = 'paper-id-123';
        const mockPaperDoc = {
          exists: false,
        } as unknown as DocumentSnapshot;
        const mockPaperRef = {
          get: mockGet,
        };
        const mockPapersCollection = {
          doc: vi.fn(() => mockPaperRef),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockPapersCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockPaperDoc);

        await expect(deleteSavedPaper(uid, paperId)).rejects.toThrow(
          'Paper not found'
        );
      });
    });
  });

  describe('Query History Operations', () => {
    describe('addQueryHistory', () => {
      it('should add query history successfully', async () => {
        const uid = 'test-uid';
        const queryData = {
          query: 'machine learning',
          type: 'keyword',
          resultCount: 10,
        };
        const historyId = 'history-id-123';
        const mockHistoryCollection = {
          add: mockAdd,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockHistoryCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockAdd.mockResolvedValue({
          id: historyId,
        });

        const result = await addQueryHistory(uid, queryData);

        expect(mockAdd).toHaveBeenCalledWith({
          query: 'machine learning',
          type: 'keyword',
          resultCount: 10,
          timestamp: expect.any(Number),
          createdAt: expect.any(String),
        });
        expect(result).toEqual({
          id: historyId,
          query: 'machine learning',
          type: 'keyword',
          resultCount: 10,
          timestamp: expect.any(Number),
          createdAt: expect.any(String),
        });
      });

      it('should use default type and resultCount if not provided', async () => {
        const uid = 'test-uid';
        const queryData = {
          query: 'test query',
          type: 'keyword' as const,
          resultCount: 0,
        };
        const historyId = 'history-id-123';
        const mockHistoryCollection = {
          add: mockAdd,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockHistoryCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockAdd.mockResolvedValue({
          id: historyId,
        });

        await addQueryHistory(uid, queryData);

        expect(mockAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'keyword',
            resultCount: 0,
          })
        );
      });

      it('should trim query text', async () => {
        const uid = 'test-uid';
        const queryData = {
          query: '  machine learning  ',
          type: 'keyword',
          resultCount: 0,
        };
        const historyId = 'history-id-123';
        const mockHistoryCollection = {
          add: mockAdd,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockHistoryCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockAdd.mockResolvedValue({
          id: historyId,
        });

        await addQueryHistory(uid, queryData);

        expect(mockAdd).toHaveBeenCalledWith(
          expect.objectContaining({
            query: 'machine learning',
          })
        );
      });
    });

    describe('getQueryHistory', () => {
      it('should get query history successfully', async () => {
        const uid = 'test-uid';
        const mockHistory = [
          {
            id: 'history-1',
            query: 'query 1',
            type: 'keyword',
            resultCount: 10,
            timestamp: 1234567890,
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ];
        const mockQuerySnapshot = {
          docs: mockHistory.map((item) => ({
            id: item.id,
            data: () => ({
              query: item.query,
              type: item.type,
              resultCount: item.resultCount,
              timestamp: item.timestamp,
              createdAt: item.createdAt,
            }),
          })),
        } as unknown as QuerySnapshot;
        const mockHistoryCollection = {
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: mockGet,
            })),
          })),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockHistoryCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockQuerySnapshot);

        const result = await getQueryHistory(uid, 20);

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          id: 'history-1',
          query: 'query 1',
          type: 'keyword',
          resultCount: 10,
          timestamp: 1234567890,
          createdAt: '2024-01-01T00:00:00.000Z',
        });
      });

      it('should use default limit of 20', async () => {
        const uid = 'test-uid';
        const mockQuerySnapshot = {
          docs: [],
        } as unknown as QuerySnapshot;
        const mockHistoryCollection = {
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => ({
              get: mockGet,
            })),
          })),
        };
        const mockUserRef = {
          collection: vi.fn(() => mockHistoryCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockQuerySnapshot);

        await getQueryHistory(uid);

        expect(mockHistoryCollection.orderBy).toHaveBeenCalledWith(
          'timestamp',
          'desc'
        );
      });

      it('should throw error for invalid limit', async () => {
        await expect(getQueryHistory('test-uid', 0)).rejects.toThrow(
          'Limit must be a positive number'
        );
      });
    });

    describe('clearQueryHistory', () => {
      it('should clear all query history successfully', async () => {
        const uid = 'test-uid';
        const mockDocs = [
          { id: 'doc-1', ref: {} },
          { id: 'doc-2', ref: {} },
        ];
        const mockQuerySnapshot = {
          empty: false,
          docs: mockDocs,
        } as unknown as QuerySnapshot;
        const mockHistoryCollection = {
          get: mockGet,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockHistoryCollection),
        };
        const mockBatchInstance = {
          delete: vi.fn(),
          commit: mockCommit,
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockQuerySnapshot);
        mockBatch.mockReturnValue(mockBatchInstance);
        mockCommit.mockResolvedValue(undefined);

        const result = await clearQueryHistory(uid);

        expect(mockBatch).toHaveBeenCalled();
        expect(mockBatchInstance.delete).toHaveBeenCalledTimes(2);
        expect(mockCommit).toHaveBeenCalled();
        expect(result).toBe(2);
      });

      it('should return 0 if no history exists', async () => {
        const uid = 'test-uid';
        const mockQuerySnapshot = {
          empty: true,
          docs: [],
        } as unknown as QuerySnapshot;
        const mockHistoryCollection = {
          get: mockGet,
        };
        const mockUserRef = {
          collection: vi.fn(() => mockHistoryCollection),
        };
        mockDoc.mockReturnValue(mockUserRef);
        mockGet.mockResolvedValue(mockQuerySnapshot);

        const result = await clearQueryHistory(uid);

        expect(result).toBe(0);
        expect(mockBatch).not.toHaveBeenCalled();
      });
    });
  });
});

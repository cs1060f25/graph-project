import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import userRouter from '../../../api/routes/user.js';
import { verifyFirebaseToken } from '../../../api/middleware/auth.js';
import * as dbService from '../../../services/db_service.js';

vi.mock('../../../api/middleware/auth.js', () => ({
  verifyFirebaseToken: vi.fn((req, res, next) => {
    req.uid = 'test-uid';
    next();
  }),
}));

vi.mock('../../../services/db_service.js', () => ({
  getSavedPapers: vi.fn(),
  createSavedPaper: vi.fn(),
  updateSavedPaper: vi.fn(),
  deleteSavedPaper: vi.fn(),
  getFolders: vi.fn(),
  createFolder: vi.fn(),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
  getUser: vi.fn(),
  getQueryHistory: vi.fn(),
  addQueryHistory: vi.fn(),
  clearQueryHistory: vi.fn(),
}));

const mockDbService = vi.mocked(dbService);

describe('User Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/user', userRouter);
  });

  describe('GET /api/user/papers', () => {
    it('should get saved papers successfully', async () => {
      const mockPapers = [
        {
          id: 'paper-1',
          title: 'Paper 1',
          authors: ['Author'],
          link: 'https://example.com',
        },
      ];

      mockDbService.getSavedPapers.mockResolvedValue(mockPapers as any);

      const response = await request(app)
        .get('/api/user/papers')
        .expect(200);

      expect(response.body).toEqual(mockPapers);
      expect(mockDbService.getSavedPapers).toHaveBeenCalledWith('test-uid');
    });

    it('should return empty array if no papers', async () => {
      mockDbService.getSavedPapers.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/user/papers')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should handle service errors', async () => {
      mockDbService.getSavedPapers.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/user/papers')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch papers');
    });
  });

  describe('POST /api/user/papers', () => {
    it('should create saved paper successfully', async () => {
      const paperData = {
        title: 'New Paper',
        authors: ['Author'],
        link: 'https://example.com',
      };

      const createdPaper = {
        id: 'paper-123',
        ...paperData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockDbService.createSavedPaper.mockResolvedValue(createdPaper as any);

      const response = await request(app)
        .post('/api/user/papers')
        .send(paperData)
        .expect(201);

      expect(response.body).toEqual(createdPaper);
      expect(mockDbService.createSavedPaper).toHaveBeenCalledWith('test-uid', paperData);
    });

    it('should handle validation errors', async () => {
      mockDbService.createSavedPaper.mockRejectedValue(new Error('Missing required fields'));

      const response = await request(app)
        .post('/api/user/papers')
        .send({ title: 'Paper' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Failed to create paper');
    });
  });

  describe('PATCH /api/user/papers/:paperId', () => {
    it('should update paper successfully', async () => {
      const updatedPaper = {
        id: 'paper-123',
        title: 'Updated Paper',
        authors: ['Author'],
        link: 'https://example.com',
      };

      mockDbService.updateSavedPaper.mockResolvedValue(updatedPaper as any);

      const response = await request(app)
        .patch('/api/user/papers/paper-123')
        .send({ title: 'Updated Paper' })
        .expect(200);

      expect(response.body).toEqual(updatedPaper);
      expect(mockDbService.updateSavedPaper).toHaveBeenCalledWith('test-uid', 'paper-123', { title: 'Updated Paper' });
    });

    it('should return 404 if paper not found', async () => {
      mockDbService.updateSavedPaper.mockRejectedValue(new Error('Paper not found'));

      const response = await request(app)
        .patch('/api/user/papers/paper-123')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Failed to update paper');
    });
  });

  describe('DELETE /api/user/papers/:paperId', () => {
    it('should delete paper successfully', async () => {
      mockDbService.deleteSavedPaper.mockResolvedValue(undefined);

      await request(app)
        .delete('/api/user/papers/paper-123')
        .expect(204);

      expect(mockDbService.deleteSavedPaper).toHaveBeenCalledWith('test-uid', 'paper-123');
    });

    it('should return 404 if paper not found', async () => {
      mockDbService.deleteSavedPaper.mockRejectedValue(new Error('Paper not found'));

      const response = await request(app)
        .delete('/api/user/papers/paper-123')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Failed to delete paper');
    });
  });

  describe('GET /api/user/folders', () => {
    it('should get folders successfully', async () => {
      const mockFolders = [
        { id: 'folder-1', name: 'Folder 1', createdAt: 123 },
      ];

      mockDbService.getFolders.mockResolvedValue(mockFolders as any);

      const response = await request(app)
        .get('/api/user/folders')
        .expect(200);

      expect(response.body).toEqual(mockFolders);
    });
  });

  describe('POST /api/user/folders', () => {
    it('should create folder successfully', async () => {
      const folderData = { name: 'New Folder' };
      const createdFolder = {
        id: 'folder-123',
        ...folderData,
        createdAt: Date.now(),
      };

      mockDbService.createFolder.mockResolvedValue(createdFolder as any);

      const response = await request(app)
        .post('/api/user/folders')
        .send(folderData)
        .expect(201);

      expect(response.body).toEqual(createdFolder);
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/user/folders')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Folder name is required');
    });
  });

  describe('GET /api/user/data', () => {
    it('should get user data successfully', async () => {
      const userData = {
        id: 'test-uid',
        email: 'test@example.com',
        preferences: {},
        createdAt: 1234567890,
      };

      mockDbService.getUser.mockResolvedValue(userData as any);

      const response = await request(app)
        .get('/api/user/data')
        .expect(200);

      expect(response.body).toEqual(userData);
    });

    it('should return 404 if user not found', async () => {
      mockDbService.getUser.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/user/data')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('GET /api/user/history', () => {
    it('should get query history successfully', async () => {
      const mockHistory = [
        { id: 'history-1', query: 'test', timestamp: 123 },
      ];

      mockDbService.getQueryHistory.mockResolvedValue(mockHistory as any);

      const response = await request(app)
        .get('/api/user/history')
        .expect(200);

      expect(response.body).toEqual(mockHistory);
      expect(mockDbService.getQueryHistory).toHaveBeenCalledWith('test-uid', 20);
    });

    it('should use custom limit', async () => {
      mockDbService.getQueryHistory.mockResolvedValue([]);

      await request(app)
        .get('/api/user/history?limit=50')
        .expect(200);

      expect(mockDbService.getQueryHistory).toHaveBeenCalledWith('test-uid', 50);
    });
  });

  describe('POST /api/user/history', () => {
    it('should add query history successfully', async () => {
      const historyData = {
        query: 'test query',
        type: 'keyword',
        resultCount: 10,
      };

      const createdHistory = {
        id: 'history-123',
        ...historyData,
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      mockDbService.addQueryHistory.mockResolvedValue(createdHistory as any);

      const response = await request(app)
        .post('/api/user/history')
        .send(historyData)
        .expect(201);

      expect(response.body).toEqual(createdHistory);
    });
  });

  describe('DELETE /api/user/history', () => {
    it('should clear query history successfully', async () => {
      mockDbService.clearQueryHistory.mockResolvedValue(5);

      const response = await request(app)
        .delete('/api/user/history')
        .expect(200);

      expect(response.body).toEqual({ deletedCount: 5 });
    });
  });
});


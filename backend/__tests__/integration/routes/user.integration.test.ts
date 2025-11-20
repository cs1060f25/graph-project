import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import userRouter from '../../../api/routes/user.js';
import { verifyFirebaseToken } from '../../../api/middleware/auth.js';
import { cleanupTestUser, createTestUser, getTestUid } from '../../utils/db-setup.js';

// Mock auth middleware to allow test requests
vi.mock('../../../api/middleware/auth.js', () => ({
  verifyFirebaseToken: vi.fn((req, res, next) => {
    req.uid = req.headers['x-test-uid'] || 'test-uid';
    next();
  }),
}));

describe('User Routes - Integration Tests', () => {
  let app: express.Application;
  let testUid: string;

  beforeEach(async () => {
    testUid = getTestUid();
    await cleanupTestUser(testUid);

    app = express();
    app.use(express.json());
    app.use('/api/user', userRouter);
  });

  afterEach(async () => {
    await cleanupTestUser(testUid);
  });

  describe('Papers Endpoints', () => {
    beforeEach(async () => {
      await createTestUser(testUid, 'test@example.com');
    });

    it('should create and retrieve papers via API', async () => {
      const paperData = {
        title: 'API Test Paper',
        authors: ['API Author'],
        link: 'https://example.com/api-paper',
        summary: 'Test summary',
      };

      // Create paper
      const createResponse = await request(app)
        .post('/api/user/papers')
        .set('x-test-uid', testUid)
        .send(paperData)
        .expect(201);

      expect(createResponse.body.title).toBe(paperData.title);
      expect(createResponse.body.id).toBeTruthy();

      // Retrieve papers
      const getResponse = await request(app)
        .get('/api/user/papers')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].title).toBe(paperData.title);
    });

    it('should update paper via API', async () => {
      const paperData = {
        title: 'Original Title',
        authors: ['Author'],
        link: 'https://example.com',
      };

      const createResponse = await request(app)
        .post('/api/user/papers')
        .set('x-test-uid', testUid)
        .send(paperData)
        .expect(201);

      const paperId = createResponse.body.id;

      const updateResponse = await request(app)
        .patch(`/api/user/papers/${paperId}`)
        .set('x-test-uid', testUid)
        .send({ title: 'Updated Title', starred: true })
        .expect(200);

      expect(updateResponse.body.title).toBe('Updated Title');
      expect(updateResponse.body.starred).toBe(true);
    });

    it('should delete paper via API', async () => {
      const paperData = {
        title: 'To Delete',
        authors: ['Author'],
        link: 'https://example.com',
      };

      const createResponse = await request(app)
        .post('/api/user/papers')
        .set('x-test-uid', testUid)
        .send(paperData)
        .expect(201);

      const paperId = createResponse.body.id;

      await request(app)
        .delete(`/api/user/papers/${paperId}`)
        .set('x-test-uid', testUid)
        .expect(204);

      const getResponse = await request(app)
        .get('/api/user/papers')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(getResponse.body).toHaveLength(0);
    });
  });

  describe('Folders Endpoints', () => {
    beforeEach(async () => {
      await createTestUser(testUid, 'test@example.com');
    });

    it('should create and retrieve folders via API', async () => {
      const createResponse = await request(app)
        .post('/api/user/folders')
        .set('x-test-uid', testUid)
        .send({ name: 'API Folder' })
        .expect(201);

      expect(createResponse.body.name).toBe('API Folder');
      expect(createResponse.body.id).toBeTruthy();

      const getResponse = await request(app)
        .get('/api/user/folders')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].name).toBe('API Folder');
    });

    it('should update folder via API', async () => {
      const createResponse = await request(app)
        .post('/api/user/folders')
        .set('x-test-uid', testUid)
        .send({ name: 'Original Name' })
        .expect(201);

      const folderId = createResponse.body.id;

      const updateResponse = await request(app)
        .patch(`/api/user/folders/${folderId}`)
        .set('x-test-uid', testUid)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(updateResponse.body.name).toBe('Updated Name');
    });
  });

  describe('Query History Endpoints', () => {
    beforeEach(async () => {
      await createTestUser(testUid, 'test@example.com');
    });

    it('should add and retrieve query history via API', async () => {
      const historyData = {
        query: 'API test query',
        type: 'keyword',
        resultCount: 15,
      };

      const createResponse = await request(app)
        .post('/api/user/history')
        .set('x-test-uid', testUid)
        .send(historyData)
        .expect(201);

      expect(createResponse.body.query).toBe(historyData.query);
      expect(createResponse.body.resultCount).toBe(15);

      const getResponse = await request(app)
        .get('/api/user/history')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].query).toBe(historyData.query);
    });

    it('should clear query history via API', async () => {
      // Add some history
      await request(app)
        .post('/api/user/history')
        .set('x-test-uid', testUid)
        .send({ query: 'Query 1', type: 'keyword' })
        .expect(201);

      await request(app)
        .post('/api/user/history')
        .set('x-test-uid', testUid)
        .send({ query: 'Query 2', type: 'keyword' })
        .expect(201);

      const deleteResponse = await request(app)
        .delete('/api/user/history')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(deleteResponse.body.deletedCount).toBe(2);

      const getResponse = await request(app)
        .get('/api/user/history')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(getResponse.body).toHaveLength(0);
    });
  });

  describe('User Data Endpoint', () => {
    it('should retrieve user data via API', async () => {
      await createTestUser(testUid, 'test@example.com');

      const response = await request(app)
        .get('/api/user/data')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(response.body.id).toBe(testUid);
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/user/data')
        .set('x-test-uid', 'non-existent-uid')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });
});


import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import userRouter from '../../api/routes/user.ts';
import { cleanupTestUser, createTestUser, getTestUid } from '../utils/db-setup.js';

// Mock auth middleware for E2E tests
vi.mock('../../api/middleware/auth.ts', () => ({
  verifyFirebaseToken: vi.fn((req, res, next) => {
    req.uid = req.headers['x-test-uid'] || 'test-uid';
    next();
  }),
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/user', userRouter);

describe('E2E Workflows', () => {
  let testUid: string;

  beforeEach(async () => {
    testUid = getTestUid();
    await cleanupTestUser(testUid);
  });

  afterEach(async () => {
    await cleanupTestUser(testUid);
  });

  describe('Complete User Workflow', () => {
    it('should handle complete user lifecycle', async () => {
      // 1. Create user
      await createTestUser(testUid, 'e2e@example.com');

      // 2. Create folder
      const folderResponse = await request(app)
        .post('/api/user/folders')
        .set('x-test-uid', testUid)
        .send({ name: 'Research Papers' })
        .expect(201);

      const folderId = folderResponse.body.id;

      // 3. Create saved papers
      const paper1Response = await request(app)
        .post('/api/user/papers')
        .set('x-test-uid', testUid)
        .send({
          title: 'Paper 1',
          authors: ['Author 1'],
          link: 'https://example.com/1',
          folderId: folderId,
        })
        .expect(201);

      const paper2Response = await request(app)
        .post('/api/user/papers')
        .set('x-test-uid', testUid)
        .send({
          title: 'Paper 2',
          authors: ['Author 2'],
          link: 'https://example.com/2',
          starred: true,
        })
        .expect(201);

      // 4. Verify papers are saved
      const papersResponse = await request(app)
        .get('/api/user/papers')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(papersResponse.body).toHaveLength(2);

      // 5. Update paper
      await request(app)
        .patch(`/api/user/papers/${paper1Response.body.id}`)
        .set('x-test-uid', testUid)
        .send({ starred: true })
        .expect(200);

      // 6. Add query history
      await request(app)
        .post('/api/user/history')
        .set('x-test-uid', testUid)
        .send({
          query: 'machine learning',
          type: 'keyword',
          resultCount: 10,
        })
        .expect(201);

      // 7. Verify query history
      const historyResponse = await request(app)
        .get('/api/user/history')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(historyResponse.body).toHaveLength(1);
      expect(historyResponse.body[0].query).toBe('machine learning');

      // 8. Get user data
      const userResponse = await request(app)
        .get('/api/user/data')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(userResponse.body.id).toBe(testUid);
      expect(userResponse.body.email).toBe('e2e@example.com');

      // 9. Delete paper
      await request(app)
        .delete(`/api/user/papers/${paper2Response.body.id}`)
        .set('x-test-uid', testUid)
        .expect(204);

      // 10. Verify paper deleted
      const finalPapersResponse = await request(app)
        .get('/api/user/papers')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(finalPapersResponse.body).toHaveLength(1);
    });
  });

  describe('Paper Organization Workflow', () => {
    beforeEach(async () => {
      await createTestUser(testUid, 'test@example.com');
    });

    it('should organize papers into folders', async () => {
      // Create multiple folders
      const mlFolder = await request(app)
        .post('/api/user/folders')
        .set('x-test-uid', testUid)
        .send({ name: 'Machine Learning' })
        .expect(201);

      const nlpFolder = await request(app)
        .post('/api/user/folders')
        .set('x-test-uid', testUid)
        .send({ name: 'NLP' })
        .expect(201);

      // Add papers to folders
      await request(app)
        .post('/api/user/papers')
        .set('x-test-uid', testUid)
        .send({
          title: 'ML Paper',
          authors: ['Author'],
          link: 'https://example.com/ml',
          folderId: mlFolder.body.id,
        })
        .expect(201);

      await request(app)
        .post('/api/user/papers')
        .set('x-test-uid', testUid)
        .send({
          title: 'NLP Paper',
          authors: ['Author'],
          link: 'https://example.com/nlp',
          folderId: nlpFolder.body.id,
        })
        .expect(201);

      // Verify organization
      const papersResponse = await request(app)
        .get('/api/user/papers')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(papersResponse.body).toHaveLength(2);
      expect(papersResponse.body.find((p: any) => p.title === 'ML Paper').folderId).toBe(mlFolder.body.id);
      expect(papersResponse.body.find((p: any) => p.title === 'NLP Paper').folderId).toBe(nlpFolder.body.id);
    });
  });

  describe('Query History Workflow', () => {
    beforeEach(async () => {
      await createTestUser(testUid, 'test@example.com');
    });

    it('should track multiple queries and retrieve in order', async () => {
      const queries = [
        { query: 'deep learning', type: 'keyword', resultCount: 20 },
        { query: 'neural networks', type: 'keyword', resultCount: 15 },
        { query: 'transformer models', type: 'keyword', resultCount: 10 },
      ];

      // Add queries
      for (const query of queries) {
        await request(app)
          .post('/api/user/history')
          .set('x-test-uid', testUid)
          .send(query)
          .expect(201);
        await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      }

      // Retrieve history
      const historyResponse = await request(app)
        .get('/api/user/history')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(historyResponse.body).toHaveLength(3);
      // Should be in reverse chronological order
      expect(historyResponse.body[0].query).toBe('transformer models');
      expect(historyResponse.body[2].query).toBe('deep learning');

      // Test limit
      const limitedResponse = await request(app)
        .get('/api/user/history?limit=2')
        .set('x-test-uid', testUid)
        .expect(200);

      expect(limitedResponse.body).toHaveLength(2);
    });
  });

  describe('Error Handling Workflow', () => {
    beforeEach(async () => {
      await createTestUser(testUid, 'test@example.com');
    });

    it('should handle invalid requests gracefully', async () => {
      // Invalid paper data
      await request(app)
        .post('/api/user/papers')
        .set('x-test-uid', testUid)
        .send({ title: 'Missing authors' })
        .expect(400);

      // Invalid folder name
      await request(app)
        .post('/api/user/folders')
        .set('x-test-uid', testUid)
        .send({})
        .expect(400);

      // Non-existent paper update
      await request(app)
        .patch('/api/user/papers/non-existent-id')
        .set('x-test-uid', testUid)
        .send({ title: 'Updated' })
        .expect(404);

      // Non-existent folder update
      await request(app)
        .patch('/api/user/folders/non-existent-id')
        .set('x-test-uid', testUid)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });
});


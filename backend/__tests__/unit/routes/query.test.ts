import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import queryRouter from '../../../api/routes/query.js';
import { agentService } from '../../../services/agent_service.js';

vi.mock('../../../services/agent_service.js', () => ({
  agentService: {
    query: vi.fn(),
  },
}));

const mockAgentService = vi.mocked(agentService);

describe('Query Route', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/query', queryRouter);
  });

  describe('POST /api/query', () => {
    it('should execute query successfully', async () => {
      const mockResults = [
        {
          paper_id: '123',
          title: 'Test Paper',
          summary: 'Summary',
          published: '2024-01-01',
          authors: ['Author'],
          link: 'https://example.com',
        },
      ];

      mockAgentService.query.mockResolvedValue(mockResults as any);

      const response = await request(app)
        .post('/api/query')
        .send({ query: 'machine learning' })
        .expect(200);

      expect(response.body).toEqual(mockResults);
      expect(mockAgentService.query).toHaveBeenCalledWith('machine learning');
    });

    it('should return 400 if query is missing', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query is required and must be a string');
      expect(mockAgentService.query).not.toHaveBeenCalled();
    });

    it('should return 400 if query is not a string', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({ query: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query is required and must be a string');
    });

    it('should return 400 if query is null', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({ query: null })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query is required and must be a string');
    });

    it('should return 500 if agent service throws error', async () => {
      mockAgentService.query.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/api/query')
        .send({ query: 'test' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Service error');
    });

    it('should handle non-Error exceptions', async () => {
      mockAgentService.query.mockRejectedValue('String error');

      const response = await request(app)
        .post('/api/query')
        .send({ query: 'test' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error');
    });

    it('should reject empty string query', async () => {
      const response = await request(app)
        .post('/api/query')
        .send({ query: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query is required and must be a string');
      expect(mockAgentService.query).not.toHaveBeenCalled();
    });
  });
});


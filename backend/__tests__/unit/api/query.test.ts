import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import { Paper } from '../../../models/paper.js';

// Mock config FIRST before anything imports agent_service
jest.mock('../../../config.js', () => ({
  default: {
    GEMINI_API_KEY: 'test-api-key',
    GOOGLE_CLOUD_PROJECT: 'test-project',
    GOOGLE_CLOUD_LOCATION: 'us-central1'
  }
}));

// Create mock function that will be shared
let mockQuery: jest.MockedFunction<() => Promise<any>>;

// Mock agent_service completely to prevent module-level instantiation
jest.mock('../../../services/agent_service.js', () => {
  mockQuery = jest.fn<() => Promise<any>>();
  return {
    AgentService: class MockAgentService {
      query = mockQuery!;
    },
    agentService: {
      query: mockQuery!
    }
  };
});

// Import query router after all mocks are set up
import queryRouter from '../../../api/routes/query.js';

describe('query endpoint', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQuery.mockClear();
    app = express();
    app.use(express.json());
    app.use('/query', queryRouter);
  });

  describe('POST /', () => {
    it('should return papers for valid query', async () => {
      const mockPapers = [
        new Paper('1', 'Test Paper', 'Summary', '2024-01-01', ['Author'], 'http://example.com', 'arxiv')
      ];
      mockQuery.mockResolvedValue(mockPapers);

      const response = await request(app)
        .post('/query')
        .send({ query: 'machine learning' })
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('Test Paper');
      expect(mockQuery).toHaveBeenCalledWith('machine learning');
    });

    it('should return 400 when query is missing', async () => {
      const response = await request(app)
        .post('/query')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Query is required and must be a string');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return 400 when query is not a string', async () => {
      const response = await request(app)
        .post('/query')
        .send({ query: 123 })
        .expect(400);

      expect(response.body.error).toBe('Query is required and must be a string');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('should return 400 when query is null', async () => {
      const response = await request(app)
        .post('/query')
        .send({ query: null })
        .expect(400);

      expect(response.body.error).toBe('Query is required and must be a string');
    });

    it('should return 500 when agentService throws error', async () => {
      mockQuery.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/query')
        .send({ query: 'test' })
        .expect(500);

      expect(response.body.error).toBe('Service error');
    });

    it('should return 500 with generic message for non-Error exceptions', async () => {
      mockQuery.mockRejectedValue('String error');

      const response = await request(app)
        .post('/query')
        .send({ query: 'test' })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle empty query string', async () => {
      const mockPapers: Paper[] = [];
      mockQuery.mockResolvedValue(mockPapers);

      const response = await request(app)
        .post('/query')
        .send({ query: '' })
        .expect(200);

      expect(response.body).toHaveLength(0);
      expect(mockQuery).toHaveBeenCalledWith('');
    });

    it('should handle multiple papers in response', async () => {
      const mockPapers = [
        new Paper('1', 'Paper 1', 'Summary 1', '2024-01-01', [], '', 'arxiv'),
        new Paper('2', 'Paper 2', 'Summary 2', '2024-01-01', [], '', 'openalex')
      ];
      mockQuery.mockResolvedValue(mockPapers);

      const response = await request(app)
        .post('/query')
        .send({ query: 'test' })
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });
});


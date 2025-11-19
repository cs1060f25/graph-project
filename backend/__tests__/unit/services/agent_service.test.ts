import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GoogleGenAI } from '@google/genai';
import { Paper } from '../../../models/paper.js';

// Mock config FIRST before anything else imports it
jest.mock('../../../config.js', () => ({
  default: {
    GEMINI_API_KEY: 'test-api-key',
    GOOGLE_CLOUD_PROJECT: 'test-project',
    GOOGLE_CLOUD_LOCATION: 'us-central1'
  }
}));

jest.mock('@google/genai');
jest.mock('../../../services/arxiv_service.js');
jest.mock('../../../services/openalex_service.js');
jest.mock('../../../services/core_service.js');

// The config mock above should be enough, but the module-level instantiation
// happens when the module is imported. We need to prevent that.
// Since jest.mock is hoisted, the config mock should be applied first.
// But the issue is that when we import agent_service, it executes the module code.
// Solution: Don't mock agent_service, but ensure config is mocked first.
// The config mock should prevent the error when AgentService constructor runs.

// Import after mocks are set up
import { AgentService } from '../../../services/agent_service.js';
import * as arxivService from '../../../services/arxiv_service.js';
import * as openalexService from '../../../services/openalex_service.js';
import * as coreService from '../../../services/core_service.js';
import config from '../../../config.js';

const mockedArxivService = arxivService as jest.Mocked<typeof arxivService>;
const mockedOpenalexService = openalexService as jest.Mocked<typeof openalexService>;
const mockedCoreService = coreService as jest.Mocked<typeof coreService>;

describe('AgentService', () => {
  let agentService: AgentService;
  let mockGenAI: jest.Mocked<GoogleGenAI>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockGenAI = {
      models: {
        generateContent: jest.fn(),
        embedContent: jest.fn()
      }
    } as any;

    (GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>).mockImplementation(() => mockGenAI);
    
    agentService = new AgentService();
  });

  describe('constructor', () => {
    it('should initialize with config values', () => {
      expect(GoogleGenAI).toHaveBeenCalledWith({
        vertexai: true,
        project: 'test-project',
        location: 'us-central1',
        apiKey: 'test-api-key'
      });
    });

    it('should throw error when GEMINI_API_KEY is missing', () => {
      const originalConfig = config.GEMINI_API_KEY;
      (config as any).GEMINI_API_KEY = undefined;

      expect(() => new AgentService()).toThrow('GEMINI_API_KEY not found in config');

      (config as any).GEMINI_API_KEY = originalConfig;
    });
  });

  describe('generateContentFromVertexAI', () => {
    it('should generate content and return parsed JSON', async () => {
      const mockResponse = {
        text: JSON.stringify({
          arxiv_queries: [{ query: 'test', mode: 'topic' }],
          openalex_queries: [],
          core_queries: []
        })
      };

      mockGenAI.models.generateContent.mockResolvedValue(mockResponse as any);

      const result = await agentService.generateContentFromVertexAI('test query');

      expect(mockGenAI.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-pro',
          contents: 'test query'
        })
      );
      expect(typeof result).toBe('string');
    });

    it('should handle empty response', async () => {
      mockGenAI.models.generateContent.mockResolvedValue({ text: null } as any);

      const result = await agentService.generateContentFromVertexAI('test');

      expect(result).toBe('');
    });
  });

  describe('getEmbedding', () => {
    it('should return embedding values', async () => {
      const mockEmbedding = { embeddings: [{ values: [0.1, 0.2, 0.3] }] };
      mockGenAI.models.embedContent.mockResolvedValue(mockEmbedding as any);

      const embedding = await (agentService as any).getEmbedding('test text');

      expect(embedding).toEqual([0.1, 0.2, 0.3]);
      expect(mockGenAI.models.embedContent).toHaveBeenCalledWith({
        model: 'text-embedding-004',
        contents: 'test text'
      });
    });

    it('should return empty array when no embeddings', async () => {
      mockGenAI.models.embedContent.mockResolvedValue({ embeddings: [] } as any);

      const embedding = await (agentService as any).getEmbedding('test');

      expect(embedding).toEqual([]);
    });

    it('should throw error on failure', async () => {
      mockGenAI.models.embedContent.mockRejectedValue(new Error('API error'));

      await expect((agentService as any).getEmbedding('test')).rejects.toThrow('Failed to get embedding');
    });
  });

  describe('calculateSemanticSimilarity', () => {
    beforeEach(() => {
      mockGenAI.models.embedContent.mockResolvedValue({
        embeddings: [{ values: [1, 0, 0] }]
      } as any);
    });

    it('should calculate cosine similarity correctly', async () => {
      // Mock embeddings: [1,0,0] and [1,0,0] -> cosine similarity = 1
      mockGenAI.models.embedContent
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 0, 0] }] } as any)
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 0, 0] }] } as any);

      const similarity = await agentService.calculateSemanticSimilarity('text a', 'text b');

      // Cosine similarity of [1,0,0] and [1,0,0] = 1, normalized to 0-1 range = 1
      expect(similarity).toBe(1);
    });

    it('should return 0 for empty embeddings', async () => {
      mockGenAI.models.embedContent
        .mockResolvedValueOnce({ embeddings: [{ values: [] }] } as any)
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 0, 0] }] } as any);

      const similarity = await agentService.calculateSemanticSimilarity('text a', 'text b');

      expect(similarity).toBe(0);
    });

    it('should throw error for mismatched dimensions', async () => {
      mockGenAI.models.embedContent
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 0] }] } as any)
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 0, 0] }] } as any);

      await expect(agentService.calculateSemanticSimilarity('text a', 'text b'))
        .rejects.toThrow('Embedding dimensions do not match');
    });

    it('should handle zero magnitude vectors', async () => {
      mockGenAI.models.embedContent
        .mockResolvedValueOnce({ embeddings: [{ values: [0, 0, 0] }] } as any)
        .mockResolvedValueOnce({ embeddings: [{ values: [0, 0, 0] }] } as any);

      const similarity = await agentService.calculateSemanticSimilarity('text a', 'text b');

      expect(similarity).toBe(0);
    });

    it('should throw error on embedding failure', async () => {
      mockGenAI.models.embedContent.mockRejectedValue(new Error('API error'));

      await expect(agentService.calculateSemanticSimilarity('text a', 'text b'))
        .rejects.toThrow('Failed to calculate semantic similarity');
    });
  });

  describe('rerankResults', () => {
    it('should rerank results by similarity', async () => {
      const papers = [
        new Paper('1', 'Title A', 'Summary A', '2024-01-01', [], '', 'arxiv'),
        new Paper('2', 'Title B', 'Summary B', '2024-01-01', [], '', 'arxiv')
      ];

      mockGenAI.models.embedContent
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 0, 0] }] } as any) // query embedding
        .mockResolvedValueOnce({ embeddings: [{ values: [0.5, 0, 0] }] } as any) // paper 1
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 0, 0] }] } as any) // paper 2

      const reranked = await agentService.rerankResults('test query', papers);

      expect(reranked).toHaveLength(2);
      expect(reranked[0].paper_id).toBe('2'); // Higher similarity should be first
      expect(reranked[1].paper_id).toBe('1');
      expect(reranked[0].similarity).toBeGreaterThan(reranked[1].similarity!);
    });

    it('should handle empty results', async () => {
      const reranked = await agentService.rerankResults('test query', []);

      expect(reranked).toHaveLength(0);
    });
  });

  describe('query', () => {
    beforeEach(() => {
      mockGenAI.models.generateContent.mockResolvedValue({
        text: JSON.stringify({
          arxiv_queries: [{ query: 'test arxiv', mode: 'topic' }],
          openalex_queries: [{ query: 'test openalex' }],
          core_queries: [{ query: 'test core', mode: 'keyword' }]
        })
      } as any);

      const mockPaper = new Paper('1', 'Test', 'Summary', '2024-01-01', [], '', 'arxiv');
      mockedArxivService.searchArxiv.mockResolvedValue([mockPaper]);
      mockedOpenalexService.searchOpenalex.mockResolvedValue([mockPaper]);
      mockedCoreService.searchCore.mockResolvedValue([mockPaper]);

      mockGenAI.models.embedContent.mockResolvedValue({
        embeddings: [{ values: [1, 0, 0] }]
      } as any);
    });

    it('should execute full query pipeline successfully', async () => {
      const results = await agentService.query('test query');

      expect(mockGenAI.models.generateContent).toHaveBeenCalled();
      expect(mockedArxivService.searchArxiv).toHaveBeenCalledWith('test arxiv', 10, 0, 'topic');
      expect(mockedOpenalexService.searchOpenalex).toHaveBeenCalledWith('test openalex', 10);
      expect(mockedCoreService.searchCore).toHaveBeenCalledWith('test core', 10, 'keyword');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle empty query arrays', async () => {
      mockGenAI.models.generateContent.mockResolvedValue({
        text: JSON.stringify({
          arxiv_queries: [],
          openalex_queries: [],
          core_queries: []
        })
      } as any);

      const results = await agentService.query('test query');

      expect(results).toHaveLength(0);
      expect(mockedArxivService.searchArxiv).not.toHaveBeenCalled();
    });

    it('should handle missing query arrays in response', async () => {
      mockGenAI.models.generateContent.mockResolvedValue({
        text: JSON.stringify({})
      } as any);

      const results = await agentService.query('test query');

      expect(results).toHaveLength(0);
    });

    it('should handle invalid JSON response', async () => {
      mockGenAI.models.generateContent.mockResolvedValue({
        text: 'invalid json'
      } as any);

      await expect(agentService.query('test query')).rejects.toThrow();
    });

    it('should handle LLM generation failure', async () => {
      mockGenAI.models.generateContent.mockRejectedValue(new Error('LLM error'));

      await expect(agentService.query('test query')).rejects.toThrow('AI-augmented query process failed');
    });

    it('should handle API search failures', async () => {
      mockedArxivService.searchArxiv.mockRejectedValue(new Error('API error'));

      await expect(agentService.query('test query')).rejects.toThrow('AI-augmented query process failed');
    });

    it('should handle non-string LLM response', async () => {
      mockGenAI.models.generateContent.mockResolvedValue({
        text: { arxiv_queries: [] }
      } as any);

      const results = await agentService.query('test query');

      expect(results).toHaveLength(0);
    });
  });
});


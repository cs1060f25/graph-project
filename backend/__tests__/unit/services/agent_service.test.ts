import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentService } from '../../../services/agent_service.js';
import { Paper } from '../../../models/paper.js';
import * as arxivService from '../../../services/arxiv_service.js';
import * as openalexService from '../../../services/openalex_service.js';
import * as coreService from '../../../services/core_service.js';

// Mock dependencies
vi.mock('../../../services/arxiv_service.js');
vi.mock('../../../services/openalex_service.js');
vi.mock('../../../services/core_service.js');
vi.mock('../../../config.js', () => ({
  default: {
    GEMINI_API_KEY: 'test-api-key',
    GOOGLE_CLOUD_PROJECT: 'test-project',
    GOOGLE_CLOUD_LOCATION: 'us-central1',
  },
}));

// Mock GoogleGenAI - create mocks inside the mock factory
vi.mock('@google/genai', () => {
  const mockModels = {
    generateContent: vi.fn(),
    embedContent: vi.fn(),
  };

  const mockGenAIInstance = {
    models: mockModels,
  };

  return {
    GoogleGenAI: vi.fn(() => mockGenAIInstance),
    Type: {}, // Mock Type enum/object
    // Export mockModels so tests can access them
    __mockModels: mockModels,
  };
});

describe('AgentService', () => {
  let agentService: AgentService;
  let mockModels: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked models from the module
    const genAIModule = await import('@google/genai');
    mockModels = (genAIModule as any).__mockModels;
    
    agentService = new AgentService();
  });

  describe('Constructor', () => {
    it('should initialize with valid config', () => {
      expect(agentService).toBeInstanceOf(AgentService);
    });
  });

  describe('generateContentFromVertexAI', () => {
    it('should generate content successfully', async () => {
      const mockResponse = {
        text: JSON.stringify({
          arxiv_queries: [{ query: 'machine learning', mode: 'keyword' }],
          openalex_queries: [],
          core_queries: [],
        }),
      };

      mockModels.generateContent.mockResolvedValue(mockResponse);

      const result = await agentService.generateContentFromVertexAI('test query');

      expect(result).toBe(mockResponse.text);
      expect(mockModels.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-pro',
          contents: 'test query',
        })
      );
    });

    it('should handle empty text response', async () => {
      const mockResponse = {
        text: null,
      };

      mockModels.generateContent.mockResolvedValue(mockResponse);

      const result = await agentService.generateContentFromVertexAI('test query');

      expect(result).toBe('');
    });
  });

  describe('getEmbedding', () => {
    it('should get embedding successfully', async () => {
      const mockEmbedding = {
        embeddings: [{
          values: Array(768).fill(0.5),
        }],
      };

      mockModels.embedContent.mockResolvedValue(mockEmbedding);

      // Access private method via any cast for testing
      const result = await (agentService as any).getEmbedding('test text');

      expect(result).toEqual(Array(768).fill(0.5));
      expect(mockModels.embedContent).toHaveBeenCalledWith({
        model: 'text-embedding-004',
        contents: 'test text',
      });
    });

    it('should return empty array if no embeddings', async () => {
      const mockEmbedding = {
        embeddings: [],
      };

      mockModels.embedContent.mockResolvedValue(mockEmbedding);

      const result = await (agentService as any).getEmbedding('test text');

      expect(result).toEqual([]);
    });

    it('should throw error on failure', async () => {
      mockModels.embedContent.mockRejectedValue(new Error('API Error'));

      await expect((agentService as any).getEmbedding('test text')).rejects.toThrow('Failed to get embedding');
    });
  });

  describe('calculateSemanticSimilarity', () => {
    beforeEach(() => {
      const mockEmbedding = {
        embeddings: [{
          values: Array(768).fill(0.5),
        }],
      };
      mockModels.embedContent.mockResolvedValue(mockEmbedding);
    });

    it('should calculate similarity between two texts', async () => {
      const result = await agentService.calculateSemanticSimilarity('text a', 'text b');

      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty embeddings', async () => {
      mockModels.embedContent.mockResolvedValue({ embeddings: [{ values: [] }] });

      const result = await agentService.calculateSemanticSimilarity('text a', 'text b');

      expect(result).toBe(0);
    });

    it('should throw error for mismatched dimensions', async () => {
      mockModels.embedContent
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 2, 3] }] })
        .mockResolvedValueOnce({ embeddings: [{ values: [1, 2] }] });

      await expect(
        agentService.calculateSemanticSimilarity('text a', 'text b')
      ).rejects.toThrow('Embedding dimensions do not match');
    });

    it('should handle zero magnitude vectors', async () => {
      mockModels.embedContent.mockResolvedValue({ embeddings: [{ values: Array(768).fill(0) }] });

      const result = await agentService.calculateSemanticSimilarity('text a', 'text b');

      expect(result).toBe(0);
    });
  });

  describe('rerankResults', () => {
    it('should rerank papers by similarity', async () => {
      const papers = [
        new Paper('1', 'Title 1', 'Summary 1', '2024-01-01', ['Author'], 'link1', 'arxiv'),
        new Paper('2', 'Title 2', 'Summary 2', '2024-01-01', ['Author'], 'link2', 'arxiv'),
      ];

      // Mock similarity calculations
      mockModels.embedContent
        .mockResolvedValueOnce({ embeddings: [{ values: Array(768).fill(0.9) }] }) // High similarity
        .mockResolvedValueOnce({ embeddings: [{ values: Array(768).fill(0.5) }] }) // Lower similarity
        .mockResolvedValueOnce({ embeddings: [{ values: Array(768).fill(0.9) }] })
        .mockResolvedValueOnce({ embeddings: [{ values: Array(768).fill(0.5) }] });

      const result = await agentService.rerankResults('test query', papers);

      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBeGreaterThanOrEqual(result[1].similarity || 0);
    });

    it('should handle empty results', async () => {
      const result = await agentService.rerankResults('test query', []);

      expect(result).toEqual([]);
    });
  });

  describe('query', () => {
    it('should execute full query workflow', async () => {
      const mockLLMResponse = JSON.stringify({
        arxiv_queries: [{ query: 'machine learning', mode: 'keyword' }],
        openalex_queries: [],
        core_queries: [],
      });

      const mockPapers = [
        new Paper('1', 'Title 1', 'Summary 1', '2024-01-01', ['Author'], 'link1', 'arxiv'),
      ];

      mockModels.generateContent.mockResolvedValue({ text: mockLLMResponse });
      mockModels.embedContent.mockResolvedValue({ embeddings: [{ values: Array(768).fill(0.5) }] });

      vi.mocked(arxivService.searchArxiv).mockResolvedValue(mockPapers);
      vi.mocked(openalexService.searchOpenalex).mockResolvedValue([]);
      vi.mocked(coreService.searchCore).mockResolvedValue([]);

      const result = await agentService.query('machine learning');

      expect(result).toBeInstanceOf(Array);
      expect(arxivService.searchArxiv).toHaveBeenCalled();
    });

    it('should handle LLM parsing errors', async () => {
      mockModels.generateContent.mockResolvedValue({ text: 'invalid json' });

      await expect(agentService.query('test')).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      const mockLLMResponse = JSON.stringify({
        arxiv_queries: [{ query: 'test', mode: 'keyword' }],
        openalex_queries: [],
        core_queries: [],
      });

      mockModels.generateContent.mockResolvedValue({ text: mockLLMResponse });
      vi.mocked(arxivService.searchArxiv).mockRejectedValue(new Error('API Error'));

      await expect(agentService.query('test')).rejects.toThrow();
    });

    it('should handle empty query results', async () => {
      const mockLLMResponse = JSON.stringify({
        arxiv_queries: [],
        openalex_queries: [],
        core_queries: [],
      });

      mockModels.generateContent.mockResolvedValue({ text: mockLLMResponse });
      mockModels.embedContent.mockResolvedValue({ embeddings: [{ values: Array(768).fill(0.5) }] });

      const result = await agentService.query('test');

      expect(result).toEqual([]);
    });

    it('should handle queries from all three APIs', async () => {
      const mockLLMResponse = JSON.stringify({
        arxiv_queries: [{ query: 'ml', mode: 'keyword' }],
        openalex_queries: [{ query: 'neural networks' }],
        core_queries: [{ query: 'deep learning', mode: 'keyword' }],
      });

      const mockPapers = [
        new Paper('1', 'Arxiv Paper', 'Summary', '2024-01-01', ['Author'], 'link1', 'arxiv'),
        new Paper('2', 'OpenAlex Paper', 'Summary', '2024-01-01', ['Author'], 'link2', 'openalex'),
        new Paper('3', 'CORE Paper', 'Summary', '2024-01-01', ['Author'], 'link3', 'core'),
      ];

      mockModels.generateContent.mockResolvedValue({ text: mockLLMResponse });
      mockModels.embedContent.mockResolvedValue({ embeddings: [{ values: Array(768).fill(0.5) }] });

      vi.mocked(arxivService.searchArxiv).mockResolvedValue([mockPapers[0]]);
      vi.mocked(openalexService.searchOpenalex).mockResolvedValue([mockPapers[1]]);
      vi.mocked(coreService.searchCore).mockResolvedValue([mockPapers[2]]);

      const result = await agentService.query('test');

      expect(result).toHaveLength(3);
      expect(arxivService.searchArxiv).toHaveBeenCalled();
      expect(openalexService.searchOpenalex).toHaveBeenCalled();
      expect(coreService.searchCore).toHaveBeenCalled();
    });

    it('should handle rerankResults with papers without similarity scores', async () => {
      const papers = [
        new Paper('1', 'Title 1', 'Summary 1', '2024-01-01', ['Author'], 'link1', 'arxiv'),
        new Paper('2', 'Title 2', 'Summary 2', '2024-01-01', ['Author'], 'link2', 'arxiv'),
      ];

      mockModels.embedContent.mockResolvedValue({ embeddings: [{ values: Array(768).fill(0.5) }] });

      const result = await agentService.rerankResults('test query', papers);

      expect(result).toHaveLength(2);
      expect(result[0].similarity).toBeDefined();
      expect(result[1].similarity).toBeDefined();
    });

    it('should handle non-string LLM response', async () => {
      const mockResponse = {
        arxiv_queries: [{ query: 'test', mode: 'keyword' }],
        openalex_queries: [],
        core_queries: [],
      };

      mockModels.generateContent.mockResolvedValue({ text: mockResponse as any });
      mockModels.embedContent.mockResolvedValue({ embeddings: [{ values: Array(768).fill(0.5) }] });

      vi.mocked(arxivService.searchArxiv).mockResolvedValue([]);

      const result = await agentService.query('test');

      expect(result).toBeInstanceOf(Array);
    });
  });
});


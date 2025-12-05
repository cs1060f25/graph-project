// server/tests/graphService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GraphService from '../services/graph/graphService.js';
import APIHandlerService from '../services/papers/api/APIHandlerService.js';

vi.mock('../services/papers/api/APIHandlerService.js');

describe('GraphService', () => {
  let graphService;
  let mockApiHandler;

  beforeEach(() => {
    mockApiHandler = {
      makeQuery: vi.fn(),
    };
    APIHandlerService.mockImplementation(() => mockApiHandler);
    graphService = new GraphService();
  });

  describe('expandLayer', () => {
    it('should expand layer with related papers', async () => {
      const currentLayerPapers = [
        { id: 'paper-1', title: 'Paper 1' },
        { id: 'paper-2', title: 'Paper 2' },
      ];
      const allExistingPapers = [...currentLayerPapers];
      const mockRelatedPapers = [
        { id: 'paper-3', title: 'Related 1', relatedTo: 'paper-1' },
        { id: 'paper-4', title: 'Related 2', relatedTo: 'paper-2' },
      ];

      mockApiHandler.makeQuery.mockResolvedValue(mockRelatedPapers);

      const result = await graphService.expandLayer({
        currentLayerPapers,
        allExistingPapers,
        maxPerPaper: 3,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(p => p.relatedTo)).toBe(true);
    });

    it('should handle author-based expansion', async () => {
      const currentLayerPapers = [{ id: 'paper-1', title: 'Paper 1' }];
      const allExistingPapers = [...currentLayerPapers];
      const mockAuthorPapers = [
        { id: 'paper-5', title: 'Author Paper 1', authors: ['John Doe'] },
      ];

      mockApiHandler.makeQuery.mockResolvedValue(mockAuthorPapers);

      const result = await graphService.expandLayer({
        currentLayerPapers,
        allExistingPapers,
        authorName: 'John Doe',
        maxPerPaper: 3,
      });

      expect(mockApiHandler.makeQuery).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should deduplicate results', async () => {
      const currentLayerPapers = [{ id: 'paper-1', title: 'Paper 1' }];
      const allExistingPapers = [...currentLayerPapers];
      const mockPapers = [
        { id: 'paper-3', title: 'Related 1', relatedTo: 'paper-1' },
        { id: 'paper-3', title: 'Related 1', relatedTo: 'paper-1' }, // Duplicate
      ];

      mockApiHandler.makeQuery.mockResolvedValue(mockPapers);

      const result = await graphService.expandLayer({
        currentLayerPapers,
        allExistingPapers,
        maxPerPaper: 3,
      });

      const uniqueIds = new Set(result.map(p => p.id));
      expect(result.length).toBe(uniqueIds.size);
    });
  });
});


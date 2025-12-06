// server/tests/paperService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PaperService from '../services/papers/paperService.js';
import APIHandlerService from '../services/papers/api/APIHandlerService.js';

vi.mock('../services/papers/api/APIHandlerService.js');

describe('PaperService', () => {
  let paperService;
  let mockApiHandler;

  beforeEach(() => {
    mockApiHandler = {
      makeQuery: vi.fn(),
    };
    APIHandlerService.mockImplementation(() => mockApiHandler);
    paperService = new PaperService();
  });

  it('should search papers with default options', async () => {
    const mockResults = [
      { id: 'paper-1', title: 'Test Paper 1' },
      { id: 'paper-2', title: 'Test Paper 2' },
    ];
    mockApiHandler.makeQuery.mockResolvedValue(mockResults);

    const results = await paperService.searchPapers('test query');

    expect(mockApiHandler.makeQuery).toHaveBeenCalledWith('test query', {
      type: 'keyword',
      maxResultsOverride: undefined,
      forceRefresh: false,
    });
    expect(results).toEqual(mockResults);
  });

  it('should search papers with custom options', async () => {
    const mockResults = [{ id: 'paper-1', title: 'Test Paper' }];
    mockApiHandler.makeQuery.mockResolvedValue(mockResults);

    const results = await paperService.searchPapers('test', {
      type: 'author',
      maxResults: 20,
      forceRefresh: true,
    });

    expect(mockApiHandler.makeQuery).toHaveBeenCalledWith('test', {
      type: 'author',
      maxResultsOverride: 20,
      forceRefresh: true,
    });
    expect(results).toEqual(mockResults);
  });

  it('should handle errors', async () => {
    const error = new Error('API error');
    mockApiHandler.makeQuery.mockRejectedValue(error);

    await expect(paperService.searchPapers('test')).rejects.toThrow('API error');
  });
});


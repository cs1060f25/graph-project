import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { searchOpenalex, formatQuery } from '../../../services/openalex_service.js';
import { Paper } from '../../../models/paper.js';

vi.mock('axios');

const mockedAxios = axios as any;
const mockGet = vi.fn();
mockedAxios.get = mockGet;

describe('openalex_service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockClear();
  });

  describe('formatQuery', () => {
    it('should return the query unchanged', () => {
      const query = 'machine learning';
      expect(formatQuery(query)).toBe(query);
    });
  });

  describe('searchOpenalex', () => {
    const mockResponse = {
      results: [
        {
          id: 'https://openalex.org/W123456789',
          display_name: 'Test Paper Title',
          abstract_inverted_index: {
            'This': [0],
            'is': [1],
            'a': [2],
            'test': [3],
            'abstract': [4]
          },
          publication_year: 2024,
          authorships: [
            { author: { display_name: 'John Doe' } },
            { author: { display_name: 'Jane Smith' } }
          ],
          open_access: {
            oa_url: 'https://example.com/paper.pdf'
          }
        }
      ]
    };

    it('should successfully search OpenAlex and return papers', async () => {
      mockGet.mockResolvedValue({ data: mockResponse } as any);

      const results = await searchOpenalex('machine learning', 10);

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Paper);
      expect(results[0].title).toBe('Test Paper Title');
      expect(results[0].summary).toBe('This is a test abstract');
      expect(results[0].published).toBe('2024-01-01T00:00:00Z');
      expect(results[0].authors).toEqual(['John Doe', 'Jane Smith']);
      expect(results[0].link).toBe('https://example.com/paper.pdf');
      expect(results[0].source).toBe('openalex');
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('filter=title.search:machine%20learning'),
        { timeout: 15000 }
      );
    });

    it('should handle empty results', async () => {
      mockGet.mockResolvedValue({ data: { results: [] } } as any);

      const results = await searchOpenalex('nonexistent', 10);

      expect(results).toHaveLength(0);
    });

    it('should handle missing fields gracefully', async () => {
      mockGet.mockResolvedValue({
        data: {
          results: [{
            id: 'W123',
            display_name: undefined,
            abstract_inverted_index: null,
            publication_year: null,
            authorships: [],
            open_access: null
          }]
        }
      } as any);

      const results = await searchOpenalex('test', 10);

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('');
      expect(results[0].summary).toBe('');
      expect(results[0].published).toBe('Unknown');
      expect(results[0].authors).toEqual([]);
      expect(results[0].link).toBe('W123');
    });

    it('should reconstruct abstract from inverted index correctly', async () => {
      mockGet.mockResolvedValue({
        data: {
          results: [{
            id: 'W123',
            display_name: 'Test',
            abstract_inverted_index: {
              'Hello': [0, 3],
              'world': [1],
              'test': [2]
            }
          }]
        }
      } as any);

      const results = await searchOpenalex('test', 10);

      expect(results[0].summary).toBe('Hello world test Hello');
    });

    it('should prefer oa_url over doi over id for link', async () => {
      mockGet.mockResolvedValue({
        data: {
          results: [{
            id: 'W123',
            display_name: 'Test',
            doi: '10.1234/test',
            open_access: {
              oa_url: 'https://oa.example.com/paper.pdf'
            }
          }]
        }
      } as any);

      const results = await searchOpenalex('test', 10);

      expect(results[0].link).toBe('https://oa.example.com/paper.pdf');
    });

    it('should fallback to doi when oa_url is missing', async () => {
      mockGet.mockResolvedValue({
        data: {
          results: [{
            id: 'W123',
            display_name: 'Test',
            doi: '10.1234/test',
            open_access: null
          }]
        }
      } as any);

      const results = await searchOpenalex('test', 10);

      expect(results[0].link).toBe('10.1234/test');
    });

    it('should handle authorships with missing author data', async () => {
      mockGet.mockResolvedValue({
        data: {
          results: [{
            id: 'W123',
            display_name: 'Test',
            authorships: [
              { author: { display_name: 'Valid Author' } },
              { author: null },
              { author: { display_name: null } }
            ]
          }]
        }
      } as any);

      const results = await searchOpenalex('test', 10);

      expect(results[0].authors).toEqual(['Valid Author']);
    });

    it('should handle axios response errors', async () => {
      const axiosError = {
        response: { status: 500 },
        message: 'Internal Server Error',
        code: 'ERR_BAD_RESPONSE'
      };
      mockGet.mockRejectedValue(axiosError);

      await expect(searchOpenalex('test', 10)).rejects.toThrow('Failed to fetch papers from OpenAlex');
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockGet.mockRejectedValue(networkError);

      await expect(searchOpenalex('test', 10)).rejects.toThrow('OpenAlex search failed');
    });
  });
});

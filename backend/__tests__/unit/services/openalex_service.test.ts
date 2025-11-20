import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { searchOpenalex, formatQuery } from '../../../services/openalex_service.js';
import { Paper } from '../../../models/paper.js';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('OpenAlexService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatQuery', () => {
    it('should return query as-is', () => {
      expect(formatQuery('test query')).toBe('test query');
    });
  });

  // Note: reconstructAbstract is a private function, tested indirectly through searchOpenalex

  describe('searchOpenalex', () => {
    it('should search openalex successfully', async () => {
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
            },
            publication_year: 2024,
            authorships: [
              { author: { display_name: 'Author One' } },
              { author: { display_name: 'Author Two' } },
            ],
            open_access: { oa_url: 'https://example.com/paper' },
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as any);

      const results = await searchOpenalex('test query');

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Paper);
      expect(results[0].title).toBe('Test Paper Title');
      expect(results[0].summary).toBe('This is a test');
      expect(results[0].authors).toHaveLength(2);
      expect(results[0].link).toBe('https://example.com/paper');
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should handle empty results', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { results: [] },
        status: 200,
      } as any);

      const results = await searchOpenalex('nonexistent');

      expect(results).toHaveLength(0);
    });

    it('should use DOI as fallback link', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W123456789',
            display_name: 'Test Paper',
            abstract_inverted_index: null,
            publication_year: 2024,
            authorships: [],
            doi: 'https://doi.org/10.1234/test',
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as any);

      const results = await searchOpenalex('test');

      expect(results[0].link).toBe('https://doi.org/10.1234/test');
    });

    it('should use ID as final fallback link', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W123456789',
            display_name: 'Test Paper',
            abstract_inverted_index: null,
            publication_year: 2024,
            authorships: [],
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as any);

      const results = await searchOpenalex('test');

      expect(results[0].link).toBe('https://openalex.org/W123456789');
    });

    it('should handle missing publication year', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W123456789',
            display_name: 'Test Paper',
            abstract_inverted_index: null,
            publication_year: null,
            authorships: [],
            open_access: { oa_url: 'https://example.com' },
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as any);

      const results = await searchOpenalex('test');

      expect(results[0].published).toBe('Unknown');
    });

    it('should handle missing authors', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W123456789',
            display_name: 'Test Paper',
            abstract_inverted_index: null,
            publication_year: 2024,
            authorships: [],
            open_access: { oa_url: 'https://example.com' },
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as any);

      const results = await searchOpenalex('test');

      expect(results[0].authors).toHaveLength(0);
    });

    it('should encode query properly', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { results: [] },
        status: 200,
      } as any);

      await searchOpenalex('machine learning & AI');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('filter=title.search:machine%20learning%20%26%20AI'),
        expect.any(Object)
      );
    });

    it('should handle axios errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 500, data: 'Server Error' },
        message: 'Request failed',
      });

      await expect(searchOpenalex('test')).rejects.toThrow('Failed to fetch papers from OpenAlex');
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(searchOpenalex('test')).rejects.toThrow('OpenAlex search failed');
    });

    it('should handle authorships with missing author objects', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W123456789',
            display_name: 'Test Paper',
            abstract_inverted_index: null,
            publication_year: 2024,
            authorships: [
              { author: null },
              { author: { display_name: 'Valid Author' } },
            ],
            open_access: { oa_url: 'https://example.com' },
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as any);

      const results = await searchOpenalex('test');

      expect(results[0].authors).toEqual(['Valid Author']);
    });

    it('should handle authorships with missing display_name', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W123456789',
            display_name: 'Test Paper',
            abstract_inverted_index: null,
            publication_year: 2024,
            authorships: [
              { author: {} },
              { author: { display_name: 'Valid Author' } },
            ],
            open_access: { oa_url: 'https://example.com' },
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as any);

      const results = await searchOpenalex('test');

      expect(results[0].authors).toEqual(['Valid Author']);
    });

    it('should handle complex abstract reconstruction', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W123456789',
            display_name: 'Test Paper',
            abstract_inverted_index: {
              'Machine': [0],
              'learning': [1, 5],
              'is': [2],
              'a': [3],
              'powerful': [4],
              'tool': [6],
            },
            publication_year: 2024,
            authorships: [],
            open_access: { oa_url: 'https://example.com' },
          },
        ],
      };

      mockedAxios.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
      } as any);

      const results = await searchOpenalex('test');

      expect(results[0].summary).toBe('Machine learning is a powerful learning tool');
    });

    it('should handle ECONNABORTED timeout', async () => {
      mockedAxios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Timeout',
      });

      await expect(searchOpenalex('test')).rejects.toThrow('OpenAlex search failed');
    });
  });
});


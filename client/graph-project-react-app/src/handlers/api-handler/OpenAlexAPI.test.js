/**
 * Tests for OpenAlexAPI
 * GRAPH-85: Citation count extraction tests
 */

import OpenAlexAPI from './OpenAlexAPI';

// Mock fetch globally
global.fetch = jest.fn();

describe('OpenAlexAPI', () => {
  let api;

  beforeEach(() => {
    api = new OpenAlexAPI({ defaultMaxResults: 10 });
    fetch.mockClear();
  });

  describe('GRAPH-85: Citation count extraction', () => {
    it('should extract cited_by_count from OpenAlex API response', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W123456789',
            display_name: 'Test Paper with Citations',
            abstract_inverted_index: { 'This': [0], 'is': [1], 'a': [2], 'test': [3] },
            publication_year: 2023,
            authorships: [
              { author: { display_name: 'Author One' } },
              { author: { display_name: 'Author Two' } }
            ],
            open_access: { oa_url: 'https://example.com/paper' },
            cited_by_count: 45 // This is the field we need to extract
          },
          {
            id: 'https://openalex.org/W987654321',
            display_name: 'Another Paper',
            abstract_inverted_index: {},
            publication_year: 2022,
            authorships: [{ author: { display_name: 'Author Three' } }],
            cited_by_count: 0 // Papers with no citations
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await api.queryByKeyword('test query');

      // Verify citation counts are extracted
      expect(results).toHaveLength(2);
      expect(results[0].citationCount).toBe(45);
      expect(results[1].citationCount).toBe(0);
      
      // Verify other fields are still present
      expect(results[0].title).toBe('Test Paper with Citations');
      expect(results[0].authors).toContain('Author One');
    });

    it('should handle missing cited_by_count field gracefully', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W111111111',
            display_name: 'Paper Without Citation Count',
            abstract_inverted_index: {},
            publication_year: 2021,
            authorships: [],
            // cited_by_count is missing
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await api.queryByKeyword('test');

      // Should default to 0 if cited_by_count is missing
      expect(results[0].citationCount).toBe(0);
    });

    it('should extract citation counts for topic queries', async () => {
      const mockResponse = {
        results: [
          {
            id: 'https://openalex.org/W222222222',
            display_name: 'Topic Paper',
            abstract_inverted_index: {},
            publication_year: 2024,
            authorships: [],
            cited_by_count: 123
          }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const results = await api.queryByTopic('machine learning');

      expect(results[0].citationCount).toBe(123);
    });
  });

  describe('API error handling', () => {
    it('should return empty array on API error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const results = await api.queryByKeyword('test');

      expect(results).toEqual([]);
    });

    it('should return empty array on non-OK response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const results = await api.queryByKeyword('test');

      expect(results).toEqual([]);
    });
  });
});


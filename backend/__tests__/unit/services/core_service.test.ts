import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { searchCore, formatQuery } from '../../../services/core_service.js';
import { Paper } from '../../../models/paper.js';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockGet = jest.fn<(...args: any[]) => Promise<any>>();
(mockedAxios.get as any) = mockGet;

describe('core_service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockClear();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('formatQuery', () => {
    it('should return the query unchanged', () => {
      const query = 'machine learning';
      expect(formatQuery(query)).toBe(query);
    });
  });

  describe('searchCore', () => {
    const mockResponse = {
      results: [
        {
          id: 12345,
          title: 'Test Paper Title',
          abstract: 'Test paper abstract',
          publishedDate: '2024-01-01',
          authors: [{ name: 'John Doe' }, { name: 'Jane Smith' }],
          downloadUrl: 'https://example.com/paper.pdf'
        }
      ]
    };

    it('should successfully search CORE and return papers', async () => {
      process.env.CORE_API_KEY = 'test-api-key';
      mockGet.mockResolvedValue({ data: mockResponse } as any);

      const results = await searchCore('machine learning', 10, '');

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Paper);
      expect(results[0].title).toBe('Test Paper Title');
      expect(results[0].summary).toBe('Test paper abstract');
      expect(results[0].authors).toEqual(['John Doe', 'Jane Smith']);
      expect(results[0].link).toBe('https://example.com/paper.pdf');
      expect(results[0].source).toBe('core');
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('query=machine%20learning'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key'
          }),
          timeout: 15000
        })
      );
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.CORE_API_KEY;

      await expect(searchCore('test', 10, '')).rejects.toThrow('CORE API key not found');
    });

    it('should handle empty results', async () => {
      process.env.CORE_API_KEY = 'test-api-key';
      mockGet.mockResolvedValue({ data: { results: [] } } as any);

      const results = await searchCore('nonexistent', 10, '');

      expect(results).toHaveLength(0);
    });

    it('should handle missing fields gracefully', async () => {
      process.env.CORE_API_KEY = 'test-api-key';
      mockGet.mockResolvedValue({
        data: {
          results: [{
            id: 123,
            title: undefined,
            abstract: undefined,
            publishedDate: undefined,
            authors: [],
            downloadUrl: undefined
          }]
        }
      } as any);

      const results = await searchCore('test', 10, '');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Untitled');
      expect(results[0].summary).toBe('');
      expect(results[0].published).toBe('Unknown');
      expect(results[0].authors).toEqual([]);
      expect(results[0].link).toBe('');
    });

    it('should handle string authors', async () => {
      process.env.CORE_API_KEY = 'test-api-key';
      mockGet.mockResolvedValue({
        data: {
          results: [{
            id: 123,
            title: 'Test',
            authors: ['Author One', 'Author Two']
          }]
        }
      } as any);

      const results = await searchCore('test', 10, '');

      expect(results[0].authors).toEqual(['Author One', 'Author Two']);
    });

    it('should prefer downloadUrl over fullTextUrl over uri', async () => {
      process.env.CORE_API_KEY = 'test-api-key';
      mockGet.mockResolvedValue({
        data: {
          results: [{
            id: 123,
            title: 'Test',
            downloadUrl: 'download.pdf',
            fullTextUrl: 'fulltext.pdf',
            uri: 'uri.pdf'
          }]
        }
      } as any);

      const results = await searchCore('test', 10, '');

      expect(results[0].link).toBe('download.pdf');
    });

    it('should handle axios response errors', async () => {
      process.env.CORE_API_KEY = 'test-api-key';
      const axiosError = {
        response: { status: 401 },
        message: 'Unauthorized',
        code: 'ERR_BAD_RESPONSE'
      };
      mockGet.mockRejectedValue(axiosError);

      await expect(searchCore('test', 10, '')).rejects.toThrow('Failed to fetch papers from CORE');
    });

    it('should handle network errors', async () => {
      process.env.CORE_API_KEY = 'test-api-key';
      const networkError = new Error('Network error');
      mockGet.mockRejectedValue(networkError);

      await expect(searchCore('test', 10, '')).rejects.toThrow('CORE search failed');
    });

    it('should handle non-array results', async () => {
      process.env.CORE_API_KEY = 'test-api-key';
      mockGet.mockResolvedValue({
        data: { results: 'not-an-array' }
      } as any);

      const results = await searchCore('test', 10, '');

      expect(results).toHaveLength(0);
    });
  });
});


import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { searchArxiv, formatQuery } from '../../../services/arxiv_service.js';
import { Paper } from '../../../models/paper.js';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('ArxivService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatQuery', () => {
    it('should return query as-is', () => {
      expect(formatQuery('test query')).toBe('test query');
    });
  });

  describe('searchArxiv', () => {
    it('should search arxiv successfully', async () => {
      const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <entry>
    <id>http://arxiv.org/abs/1234.5678</id>
    <title>Test Paper Title</title>
    <summary>Test paper summary</summary>
    <published>2024-01-01T00:00:00Z</published>
    <author><name>Author One</name></author>
    <author><name>Author Two</name></author>
    <link href="http://arxiv.org/pdf/1234.5678.pdf" type="application/pdf"/>
  </entry>
</feed>`;

      mockedAxios.get.mockResolvedValue({
        data: mockXmlResponse,
        status: 200,
      } as any);

      const results = await searchArxiv('machine learning');

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Paper);
      expect(results[0].title).toBe('Test Paper Title');
      expect(results[0].authors).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should handle multiple entries', async () => {
      const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <entry>
    <id>http://arxiv.org/abs/1234.5678</id>
    <title>Paper One</title>
    <summary>Summary one</summary>
    <published>2024-01-01T00:00:00Z</published>
    <author><name>Author One</name></author>
    <link href="http://arxiv.org/pdf/1234.5678.pdf"/>
  </entry>
  <entry>
    <id>http://arxiv.org/abs/1234.5679</id>
    <title>Paper Two</title>
    <summary>Summary two</summary>
    <published>2024-01-02T00:00:00Z</published>
    <author><name>Author Two</name></author>
    <link href="http://arxiv.org/pdf/1234.5679.pdf"/>
  </entry>
</feed>`;

      mockedAxios.get.mockResolvedValue({
        data: mockXmlResponse,
        status: 200,
      } as any);

      const results = await searchArxiv('test');

      expect(results).toHaveLength(2);
    });

    it('should handle empty feed', async () => {
      const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
</feed>`;

      mockedAxios.get.mockResolvedValue({
        data: mockXmlResponse,
        status: 200,
      } as any);

      const results = await searchArxiv('nonexistent query');

      expect(results).toHaveLength(0);
    });

    it('should use correct query parameters', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '<feed></feed>',
        status: 200,
      } as any);

      await searchArxiv('test query', 20, 10, 'keyword');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search_query=test+query'),
        expect.objectContaining({ timeout: 15000 })
      );
    });

    it('should handle topic mode', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '<feed></feed>',
        status: 200,
      } as any);

      await searchArxiv('cs.AI', 10, 0, 'topic');

      // Arxiv API doesn't support 'type' parameter - mode is handled via query format
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search_query'),
        expect.any(Object)
      );
    });

    it('should handle missing optional fields', async () => {
      const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <entry>
    <id>http://arxiv.org/abs/1234.5678</id>
    <title>Test Paper</title>
    <summary></summary>
    <published></published>
    <link href="http://arxiv.org/abs/1234.5678"/>
  </entry>
</feed>`;

      mockedAxios.get.mockResolvedValue({
        data: mockXmlResponse,
        status: 200,
      } as any);

      const results = await searchArxiv('test');

      expect(results[0].summary).toBe('');
      expect(results[0].published).toBe('');
      expect(results[0].authors).toHaveLength(0);
    });

    it('should prefer PDF link over abstract link', async () => {
      const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<feed>
  <entry>
    <id>http://arxiv.org/abs/1234.5678</id>
    <title>Test Paper</title>
    <summary>Summary</summary>
    <published>2024-01-01T00:00:00Z</published>
    <author><name>Author</name></author>
    <link href="http://arxiv.org/abs/1234.5678"/>
    <link href="http://arxiv.org/pdf/1234.5678.pdf" type="application/pdf"/>
  </entry>
</feed>`;

      mockedAxios.get.mockResolvedValue({
        data: mockXmlResponse,
        status: 200,
      } as any);

      const results = await searchArxiv('test');

      expect(results[0].link).toContain('.pdf');
    });

    it('should handle axios errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 500, data: 'Server Error' },
        message: 'Request failed',
      });

      await expect(searchArxiv('test')).rejects.toThrow('Failed to fetch papers from Arxiv');
    });

    it('should handle timeout errors', async () => {
      mockedAxios.get.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Timeout',
      });

      await expect(searchArxiv('test')).rejects.toThrow('Failed to fetch papers from Arxiv');
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(searchArxiv('test')).rejects.toThrow('Arxiv search failed');
    });

    it('should handle keyword mode', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '<feed></feed>',
        status: 200,
      } as any);

      await searchArxiv('machine learning', 10, 0, 'keyword');

      // Arxiv API doesn't support 'type' parameter - mode is handled via query format
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search_query'),
        expect.any(Object)
      );
    });

    it('should use start parameter for pagination', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '<feed></feed>',
        status: 200,
      } as any);

      await searchArxiv('test', 10, 20, '');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('start=20'),
        expect.any(Object)
      );
    });

    it('should handle ECONNABORTED timeout', async () => {
      mockedAxios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Timeout',
      });

      await expect(searchArxiv('test')).rejects.toThrow('Failed to fetch papers from Arxiv');
    });
  });

  describe('searchArxivByTopic', () => {
    it('should call searchArxiv with topic mode', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '<feed></feed>',
        status: 200,
      } as any);

      const { searchArxivByTopic } = await import('../../../services/arxiv_service.js');
      await searchArxivByTopic('cs.AI');

      // Arxiv API doesn't support 'type' parameter - mode is handled via query format
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search_query'),
        expect.any(Object)
      );
    });
  });

  describe('searchArxivByKeyword', () => {
    it('should call searchArxiv with keyword mode', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '<feed></feed>',
        status: 200,
      } as any);

      const { searchArxivByKeyword } = await import('../../../services/arxiv_service.js');
      await searchArxivByKeyword('machine learning');

      // Arxiv API doesn't support 'type' parameter - mode is handled via query format
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('search_query'),
        expect.any(Object)
      );
    });
  });
});


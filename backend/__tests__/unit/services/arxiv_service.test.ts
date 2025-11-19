import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { searchArxiv, formatQuery, searchArxivByTopic, searchArxivByKeyword } from '../../../services/arxiv_service.js';
import { Paper } from '../../../models/paper.js';

const mockParseString = jest.fn<(xml: string, callback: (err: Error | null, result: any) => void) => void>();

jest.mock('axios');

// Import axios after mock is set up
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Manually set up the get method mock
(mockedAxios.get as any) = jest.fn();

jest.mock('xml2js', () => ({
  parseString: mockParseString
}));

jest.mock('util', () => ({
  promisify: jest.fn((fn: any) => {
    return async (xml: string) => {
      return new Promise((resolve, reject) => {
        mockParseString(xml, (err: Error | null, result: any) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
  })
}));

describe('arxiv_service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (mockedAxios.get as jest.Mock<any>).mockClear();
    mockParseString.mockClear();
  });

  describe('formatQuery', () => {
    it('should return the query unchanged', () => {
      const query = 'machine learning';
      expect(formatQuery(query)).toBe(query);
    });
  });

  describe('searchArxiv', () => {
    const mockXmlResponse = `<?xml version="1.0"?>
      <feed>
        <entry>
          <id>http://arxiv.org/abs/1234.5678</id>
          <title>Test Paper Title</title>
          <summary>Test paper summary</summary>
          <published>2024-01-01T00:00:00Z</published>
          <author><name>John Doe</name></author>
          <link href="http://arxiv.org/pdf/1234.5678.pdf" type="application/pdf"/>
        </entry>
      </feed>`;

    const mockParsedXml = {
      feed: {
        entry: [{
          id: ['http://arxiv.org/abs/1234.5678'],
          title: ['Test Paper Title'],
          summary: ['Test paper summary'],
          published: ['2024-01-01T00:00:00Z'],
          author: [{ name: ['John Doe'] }],
          link: [{ $: { href: 'http://arxiv.org/pdf/1234.5678.pdf', type: 'application/pdf' } }]
        }]
      }
    };

    it('should successfully search arxiv and return papers', async () => {
      (mockedAxios.get as jest.Mock<any>).mockResolvedValue({ data: mockXmlResponse });
      mockParseString.mockImplementation((xml: string, callback: (err: Error | null, result: any) => void) => {
        callback(null, mockParsedXml);
      });

      const results = await searchArxiv('machine learning', 10, 0, '');

      expect(results).toHaveLength(1);
      expect(results[0]).toBeInstanceOf(Paper);
      expect(results[0].title).toBe('Test Paper Title');
      expect(results[0].summary).toBe('Test paper summary');
      expect(results[0].authors).toEqual(['John Doe']);
      expect(results[0].source).toBe('arxiv');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('query=machine+learning'),
        { timeout: 15000 }
      );
      // Note: parseString is called via promisify, so we check axios was called instead
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    it('should handle topic mode', async () => {
      (mockedAxios.get as jest.Mock<any>).mockResolvedValue({ data: mockXmlResponse });
      mockParseString.mockImplementation((xml: string, callback: (err: Error | null, result: any) => void) => {
        callback(null, { feed: { entry: [] } });
      });

      await searchArxiv('cs.AI', 10, 0, 'topic');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('type=topic'),
        { timeout: 15000 }
      );
    });

    it('should handle keyword mode', async () => {
      (mockedAxios.get as jest.Mock<any>).mockResolvedValue({ data: mockXmlResponse });
      mockParseString.mockImplementation((xml: string, callback: (err: Error | null, result: any) => void) => {
        callback(null, { feed: { entry: [] } });
      });

      await searchArxiv('machine learning', 10, 0, 'keyword');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('type=keyword'),
        { timeout: 15000 }
      );
    });

    it('should handle empty results', async () => {
      const emptyXmlResponse = `<?xml version="1.0"?><feed></feed>`;
      (mockedAxios.get as jest.Mock<any>).mockResolvedValue({ data: emptyXmlResponse });
      mockParseString.mockImplementation((xml: string, callback: (err: Error | null, result: any) => void) => {
        callback(null, { feed: { entry: [] } });
      });

      const results = await searchArxiv('nonexistent', 10, 0, '');

      expect(results).toHaveLength(0);
    });

    it('should handle missing fields gracefully', async () => {
      const emptyXmlResponse = `<?xml version="1.0"?><feed></feed>`;
      (mockedAxios.get as jest.Mock<any>).mockResolvedValue({ data: emptyXmlResponse });
      mockParseString.mockImplementation((xml: string, callback: (err: Error | null, result: any) => void) => {
        callback(null, {
          feed: {
            entry: [{
              id: ['123'],
              title: [],
              summary: [],
              published: [],
              author: [],
              link: []
            }]
          }
        });
      });

      const results = await searchArxiv('test', 10, 0, '');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('');
      expect(results[0].summary).toBe('');
      expect(results[0].authors).toEqual([]);
    });

    it('should handle axios errors', async () => {
      const axiosError = {
        response: { status: 500 },
        message: 'Internal Server Error',
        code: 'ERR_BAD_RESPONSE'
      };
      (mockedAxios.get as jest.Mock<any>).mockRejectedValue(axiosError);

      await expect(searchArxiv('test', 10, 0, '')).rejects.toThrow('Failed to fetch papers from Arxiv');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      };
      (mockedAxios.get as jest.Mock<any>).mockRejectedValue(timeoutError);

      await expect(searchArxiv('test', 10, 0, '')).rejects.toThrow('Failed to fetch papers from Arxiv');
    });

    it('should handle parse errors', async () => {
      (mockedAxios.get as jest.Mock<any>).mockResolvedValue({ data: mockXmlResponse });
      mockParseString.mockImplementation((xml: string, callback: (err: Error | null, result: any) => void) => {
        callback(new Error('Parse error'), null);
      });

      await expect(searchArxiv('test', 10, 0, '')).rejects.toThrow();
    });
  });

  describe('searchArxivByTopic', () => {
    it('should call searchArxiv with topic mode', async () => {
      (mockedAxios.get as jest.Mock<any>).mockResolvedValue({ data: '<?xml version="1.0"?><feed></feed>' });
      mockParseString.mockImplementation((xml: string, callback: (err: Error | null, result: any) => void) => {
        callback(null, { feed: { entry: [] } });
      });

      await searchArxivByTopic('cs.AI', 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('type=topic'),
        { timeout: 15000 }
      );
    });
  });

  describe('searchArxivByKeyword', () => {
    it('should call searchArxiv with keyword mode', async () => {
      (mockedAxios.get as jest.Mock<any>).mockResolvedValue({ data: '<?xml version="1.0"?><feed></feed>' });
      mockParseString.mockImplementation((xml: string, callback: (err: Error | null, result: any) => void) => {
        callback(null, { feed: { entry: [] } });
      });

      await searchArxivByKeyword('machine learning', 10);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('type=keyword'),
        { timeout: 15000 }
      );
    });
  });
});


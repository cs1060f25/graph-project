import { Paper } from '../models/types';

export default class CoreAPI {
  private baseUrl = "https://api.core.ac.uk/v3";
  private defaultMaxResults: number;
  private apiKey: string | undefined;

  constructor({ defaultMaxResults = 10 } = {}) {
    this.defaultMaxResults = defaultMaxResults;
    this.apiKey = process.env.CORE_API_KEY;
    if (!this.apiKey) {
      console.warn("CORE API key not found. Set CORE_API_KEY in your .env file.");
    }
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  private async fetchResults(searchQuery: string, maxResults?: number): Promise<Paper[]> {
    if (!this.apiKey) {
      console.warn('Core API key not configured, skipping Core API search');
      return [];
    }

    const limit = maxResults ?? this.defaultMaxResults;
    const queryUrl = `${this.baseUrl}/search/works?query=${encodeURIComponent(searchQuery)}&limit=${limit}`;

    try {
      const response = await this.fetchWithTimeout(queryUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }, 15000);

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Core API rate limit exceeded');
          return [];
        }
        throw new Error(`Failed to fetch papers: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const entries = Array.isArray(data.results) ? data.results : [];

      return entries.map((entry: any) => ({
        id: entry.id,
        title: entry.title || "Untitled",
        summary: entry.abstract || "",
        published: entry.publishedDate || "Unknown",
        authors: entry.authors ? entry.authors.map((a: any) => a.name || a) : [],
        link: entry.downloadUrl || entry.fullTextUrl || entry.uri || null,
        citationCount: entry.citationsCount || entry.citationCount || 0,
      }));
    } catch (err) {
      console.error("CORE fetch failed:", err);
      return [];
    }
  }

  async queryByKeyword(keyword: string, maxResults?: number): Promise<Paper[]> {
    return await this.fetchResults(keyword, maxResults);
  }

  async queryByTopic(topic: string, maxResults?: number): Promise<Paper[]> {
    return await this.fetchResults(topic, maxResults);
  }
}


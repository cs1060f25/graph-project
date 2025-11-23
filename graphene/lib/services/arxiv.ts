import { XMLParser } from "fast-xml-parser";
import { Paper } from '../models/types';

export default class ArxivAPI {
  private baseUrl: string;
  private rateLimitMs: number;
  private defaultMaxResults: number;
  private lastRequestTime: number = 0;

  constructor({ rateLimitMs = 1000, defaultMaxResults = 10 } = {}) {
    this.baseUrl = process.env.ARXIV_PROXY_URL || "https://export.arxiv.org/api/query";
    this.rateLimitMs = rateLimitMs;
    this.defaultMaxResults = defaultMaxResults;
  }

  private async rateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimitMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private async fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
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

  private async fetchResults(url: string): Promise<Paper[]> {
    await this.rateLimit();
    try {
      const response = await this.fetchWithTimeout(url, 15000);
      if (!response.ok) {
        throw new Error(`Failed to fetch papers: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
      const jsonObj = parser.parse(text);

      const entries = jsonObj.feed?.entry || [];
      const results = Array.isArray(entries) ? entries : [entries];

      return results.map((entry: any) => ({
        id: entry.id,
        title: entry.title?.trim(),
        summary: entry.summary?.trim(),
        published: entry.published,
        authors: Array.isArray(entry.author) ? entry.author.map((a: any) => a.name) : [entry.author?.name],
        link: Array.isArray(entry.link) ? entry.link[0].href : entry.link?.href,
      }));
    } catch (err) {
      console.error("ArXiv fetch failed:", err);
      return [];
    }
  }

  async queryByTopic(topic: string, maxResults?: number): Promise<Paper[]> {
    const searchQuery = `cat:${topic}`;
    const url = `${this.baseUrl}?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=${maxResults || this.defaultMaxResults}`;
    return await this.fetchResults(url);
  }

  async queryByKeyword(keyword: string, maxResults?: number): Promise<Paper[]> {
    const searchQuery = `all:${keyword}`;
    const url = `${this.baseUrl}?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=${maxResults || this.defaultMaxResults}`;
    return await this.fetchResults(url);
  }
}


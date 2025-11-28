// src/api-handler/ArxivAPI.js

/**
 * ArxivAPI
 * Handles queries to the Arxiv API for research papers.
 * 
 * Supported queries:
 *   - queryByTopic(topic, maxResults)
 *   - queryByKeyword(keyword, maxResults)
 *
 * Features:
 *   - Rate limiting between requests
 *   - Normalized response format
 */

// npm install fast-xml-parser
import { XMLParser } from "fast-xml-parser";

export default class ArxivAPI {
  constructor({ rateLimitMs = 1000, defaultMaxResults = 10 } = {}) {
    // Use env variable or default to localhost:5000
    const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
    this.baseUrl = `${apiBaseUrl}/api/arxiv`;
    this.rateLimitMs = rateLimitMs; // Delay between requests in ms
    this.defaultMaxResults = defaultMaxResults;
    this.lastRequestTime = 0;
  }

  /**
   * Internal helper to enforce rate limit
   */
  async #rateLimit() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.rateLimitMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.rateLimitMs - elapsed)
      );
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch with timeout helper
   * @param {string} url - URL to fetch
   * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
   * @returns {Promise<Response>}
   */
  async #fetchWithTimeout(url, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * General query function for Arxiv API
   * @param {string} searchQuery - Arxiv-compatible search term (e.g., "cat:cs.AI")
   * @param {number} maxResults - Max number of results to return
   */
    async #fetchResults(url) {
      await this.#rateLimit();

      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch papers: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        
        // Parse XML -> JSON (assuming you have a parser defined)
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
        const jsonObj = parser.parse(text);

        // Normalize results
        const entries = jsonObj.feed?.entry || [];
        const results = Array.isArray(entries) ? entries : [entries];

        return results.map((entry) => ({
          id: entry.id,
          title: entry.title?.trim(),
          summary: entry.summary?.trim(),
          published: entry.published,
          authors: Array.isArray(entry.author)
            ? entry.author.map((a) => a.name)
            : [entry.author?.name],
          link: Array.isArray(entry.link)
            ? entry.link[0].href
            : entry.link?.href,
        }));
      } catch (err) {
        console.error("ArXiv fetch failed:", err);
        throw err;
      }
    }

  /**
   * Query papers by topic
   * @param {string} topic - e.g. "cs.AI" or "physics.optics"
   * @param {number} [maxResults]
   */
  async queryByTopic(topic, maxResults) {
    try {
    const url = `${this.baseUrl}?query=${encodeURIComponent(topic)}&type=topic&maxResults=${maxResults}`;
      
      console.log(`Requesting from proxy: ${url}`);
      const results = await this.#fetchResults(url);
      return results;
    } catch (error) {
      console.error('ArXiv fetch failed:', error);
      throw error;
    }
  }

  /**
   * Query papers by keyword
   * @param {string} keyword - e.g. "machine learning"
   * @param {number} [maxResults]
   */
  async queryByKeyword(keyword, maxResults) {
    try {
      // Use the proxy with query parameters
      const url = `${this.baseUrl}?query=${encodeURIComponent(keyword)}&type=keyword&maxResults=${maxResults}`;
      
      console.log(`Requesting from proxy: ${url}`);
      const results = await this.#fetchResults(url);
      return results;
    } catch (error) {
      console.error('ArXiv fetch failed:', error);
      throw error;
    }
  }
}

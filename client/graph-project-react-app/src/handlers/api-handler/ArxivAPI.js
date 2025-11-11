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
    this.baseUrl = "https://export.arxiv.org/api/query";
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
    async #fetchResults(searchQuery, maxResults) {
        await this.#rateLimit();

        const queryUrl = `${this.baseUrl}?search_query=${encodeURIComponent(
            searchQuery
        )}&start=0&max_results=${maxResults ?? this.defaultMaxResults}`;

        try {
          const response = await this.#fetchWithTimeout(queryUrl, 15000);
          
          if (!response.ok) {
            console.error("Arxiv API failed:", response.status, response.statusText);
            throw new Error(`Failed to fetch papers: ${response.statusText}`);
          }

          const text = await response.text();

          // Parse XML -> JSON
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
          console.error("Arxiv fetch failed:", err);
          return []; // Return empty array on error
        }
    }

  /**
   * Query papers by topic
   * @param {string} topic - e.g. "cs.AI" or "physics.optics"
   * @param {number} [maxResults]
   */
  async queryByTopic(topic, maxResults) {
    const searchQuery = `cat:${topic}`;
    return await this.#fetchResults(searchQuery, maxResults);
  }

  /**
   * Query papers by keyword
   * @param {string} keyword - e.g. "machine learning"
   * @param {number} [maxResults]
   */
  async queryByKeyword(keyword, maxResults) {
    const searchQuery = `all:${keyword}`;
    return await this.#fetchResults(searchQuery, maxResults);
  }
}

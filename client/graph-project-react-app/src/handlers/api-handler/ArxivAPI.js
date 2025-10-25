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
   * General query function for Arxiv API
   * @param {string} searchQuery - Arxiv-compatible search term (e.g., "cat:cs.AI")
   * @param {number} maxResults - Max number of results to return
   */
    async #fetchResults(searchQuery, maxResults) {
        await this.#rateLimit();

        const queryUrl = `${this.baseUrl}?search_query=${encodeURIComponent(
            searchQuery
        )}&start=0&max_results=${maxResults ?? this.defaultMaxResults}`;

        const response = await fetch(queryUrl);
        const text = await response.text();

        // Parse XML -> JSON
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
        const jsonObj = parser.parse(text);

        // Normalize results
        const entries = jsonObj.feed.entry || [];
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

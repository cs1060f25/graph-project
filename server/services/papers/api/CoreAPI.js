// server/services/papers/api/CoreAPI.js
// Backend CoreAPI - calls CORE API directly

import axios from 'axios';

/**
 * CoreAPI
 * Handles queries to the CORE API for research papers.
 *
 * Docs: https://api.core.ac.uk/docs/v3
 *
 * Supported queries:
 *   - queryByKeyword(keyword, maxResults)
 *   - queryByTopic(topic, maxResults)
 *
 * Features:
 *   - Requires API key (set as CORE_API_KEY in server .env)
 *   - Returns normalized response format (id, title, summary, authors, link, published)
 */

export default class CoreAPI {
  constructor({ defaultMaxResults = 10 } = {}) {
    this.baseUrl = "https://api.core.ac.uk/v3";
    this.defaultMaxResults = defaultMaxResults;
    this.apiKey = process.env.CORE_API_KEY || process.env.REACT_APP_CORE_API_KEY;

    if (!this.apiKey) {
      console.warn("CORE API key not found. Set CORE_API_KEY in your server .env file.");
    }
  }

  /**
   * Internal fetch helper
   * @param {string} endpoint - CORE API endpoint
   * @param {string} searchQuery - The search keyword or topic
   * @param {number} [maxResults]
   */
  async #fetchResults(searchQuery, maxResults) {
    const limit = maxResults ?? this.defaultMaxResults;

    const queryUrl = `${this.baseUrl}/search/works?query=${encodeURIComponent(
      searchQuery
    )}&limit=${limit}`;

    try {
      const response = await axios.get(queryUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      });

      const data = response.data;
      const entries = Array.isArray(data.results) ? data.results : [];

      return entries.map((entry) => ({
        id: entry.id,
        title: entry.title || "Untitled",
        summary: entry.abstract || "",
        published: entry.publishedDate || "Unknown",
        authors: entry.authors
          ? entry.authors.map((a) => a.name || a)
          : [],
        link: entry.downloadUrl || entry.fullTextUrl || entry.uri || null,
        // GRAPH-85: Extract citation count if available, otherwise default to 0
        citationCount: entry.citationsCount || entry.citationCount || 0,
      }));
    } catch (err) {
      console.error("CORE fetch failed:", err);
      return []; // Return empty array on error
    }
  }

  /**
   * Query papers by keyword
   * @param {string} keyword
   * @param {number} [maxResults]
   */
  async queryByKeyword(keyword, maxResults) {
    return await this.#fetchResults(keyword, maxResults);
  }

  /**
   * Query papers by topic
   * @param {string} topic
   * @param {number} [maxResults]
   */
  async queryByTopic(topic, maxResults) {
    return await this.#fetchResults(topic, maxResults);
  }
}

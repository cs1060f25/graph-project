// server/services/papers/api/ArxivAPI.js
// Backend ArxivAPI - calls Arxiv API directly

import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export default class ArxivAPI {
  constructor({ rateLimitMs = 1000, defaultMaxResults = 10 } = {}) {
    this.baseUrl = 'https://export.arxiv.org/api/query';
    this.rateLimitMs = rateLimitMs;
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

    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          search_query: searchQuery,
          start: 0,
          max_results: maxResults,
        },
        headers: {
          'User-Agent': 'Graphene/1.0 (educational project)',
        },
        timeout: 15000,
      });

      const text = response.data;
      
      // Parse XML -> JSON
      const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
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
      console.error('ArXiv fetch failed:', err);
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
      const searchQuery = `cat:${topic}`;
      const results = await this.#fetchResults(searchQuery, maxResults);
      return results;
    } catch (error) {
      console.error('ArXiv topic fetch failed:', error);
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
      const searchQuery = `all:${keyword}`;
      const results = await this.#fetchResults(searchQuery, maxResults);
      return results;
    } catch (error) {
      console.error('ArXiv keyword fetch failed:', error);
      throw error;
    }
  }

  /**
   * Query papers by author
   * @param {string} author - Author name (e.g., "Yann LeCun")
   * @param {number} [maxResults]
   */
  async queryByAuthor(author, maxResults) {
    try {
      const searchQuery = `au:"${author}"`;
      const results = await this.#fetchResults(searchQuery, maxResults);
      return results;
    } catch (error) {
      console.error('ArXiv author fetch failed:', error);
      throw error;
    }
  }
}


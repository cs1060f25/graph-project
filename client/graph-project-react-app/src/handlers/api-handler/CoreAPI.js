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
 *   - Requires API key (set as REACT_APP_CORE_API_KEY in .env)
 *   - Returns normalized response format (id, title, summary, authors, link, published)
 */

export default class CoreAPI {
  constructor({ defaultMaxResults = 10 } = {}) {
    this.baseUrl = "https://api.core.ac.uk/v3";
    this.defaultMaxResults = defaultMaxResults;
    this.apiKey = process.env.REACT_APP_CORE_API_KEY;

    if (!this.apiKey) {
      console.warn("CORE API key not found. Set REACT_APP_CORE_API_KEY in your .env file.");
    }
  }

  /**
   * Fetch with timeout helper
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @param {number} timeoutMs - Timeout in milliseconds (default: 15000)
   * @returns {Promise<Response>}
   */
  async #fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
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
      const response = await this.#fetchWithTimeout(
        queryUrl,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
        15000
      );

      if (!response.ok) {
        console.error("CORE API failed:", response.status, response.statusText);
        throw new Error(`Failed to fetch papers: ${response.statusText}`);
      }

      const data = await response.json();
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

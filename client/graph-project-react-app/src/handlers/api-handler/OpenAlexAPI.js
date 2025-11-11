/**
 * OpenAlexAPI
 * Handles queries to the OpenAlex API for research papers.
 *
 * Docs: https://docs.openalex.org/api-entities/works/search-works
 * 
 * Supported queries:
 *   - queryByTopic(topic, maxResults)
 *   - queryByKeyword(keyword, maxResults)
 *
 * Features:
 *   - No API key required (completely free)
 *   - Normalized response format (same as ArxivAPI / SemanticScholarAPI)
 *   - Reconstructs abstracts from abstract_inverted_index when available
 */

export default class OpenAlexAPI {
  constructor({ defaultMaxResults = 10 } = {}) {
    this.baseUrl = "https://api.openalex.org";
    this.defaultMaxResults = defaultMaxResults;
  }

  /** Reconstruct abstract text from OpenAlex inverted index */
  #reconstructAbstract(invIdx) {
    // if no abstract available then return this
    if (!invIdx || typeof invIdx !== "object") return "";

    const pairs = [];
    for (const [word, positions] of Object.entries(invIdx)) {
      positions.forEach((pos) => pairs.push({ pos, word }));
    }
    pairs.sort((a, b) => a.pos - b.pos);
    return pairs.map((p) => p.word).join(" ");
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
   * Internal fetch helper
   * @param {string} searchQuery - Keyword or topic query
   * @param {number} maxResults
   */
  async #fetchResults(searchQuery, maxResults) {
    const limit = maxResults ?? this.defaultMaxResults;
    const queryUrl = `${this.baseUrl}/works?filter=title.search:${encodeURIComponent(
      searchQuery
    )}&per-page=${limit}`;

    try {
      const response = await this.#fetchWithTimeout(queryUrl, 15000);

      if (!response.ok) {
        console.error(
          "OpenAlex API failed:",
          response.status,
          response.statusText
        );
        throw new Error(`Failed to fetch papers: ${response.statusText}`);
      }

      const data = await response.json();
      const entries = data.results || [];

      return entries.map((entry) => ({
        id: entry.id,
        title: entry.display_name?.trim(),
        summary: this.#reconstructAbstract(entry.abstract_inverted_index),
        published: entry.publication_year
          ? `${entry.publication_year}-01-01T00:00:00Z`
          : "Unknown",
        authors: Array.isArray(entry.authorships)
          ? entry.authorships.map((a) => a.author?.display_name)
          : [],
        link:
          entry.open_access?.oa_url ||
          entry.doi ||
          entry.id ||
          null,
      }));
    } catch (err) {
      console.error("OpenAlex fetch failed:", err);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Query papers by topic
   * @param {string} topic
   * @param {number} [maxResults]
   */
  async queryByTopic(topic, maxResults) {
    return await this.#fetchResults(topic, maxResults);
  }

  /**
   * Query papers by keyword
   * @param {string} keyword
   * @param {number} [maxResults]
   */
  async queryByKeyword(keyword, maxResults) {
    return await this.#fetchResults(keyword, maxResults);
  }
}

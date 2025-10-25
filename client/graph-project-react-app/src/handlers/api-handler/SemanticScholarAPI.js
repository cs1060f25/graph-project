/**
 * SemanticScholarAPI
 * Handles queries to the Semantic Scholar API for research papers.
 * 
 * Supported queries:
 *   - queryByTopic(topic, maxResults)
 *   - queryByKeyword(keyword, maxResults)
 *
 * Features:
 *   - Rate limiting between requests
 *   - Normalized response format (same as ArxivAPI)
 */

export default class SemanticScholarAPI {
  constructor({ rateLimitMs = 1000, defaultMaxResults = 10 } = {}) {
    this.baseUrl = "https://api.semanticscholar.org/graph/v1";
    this.rateLimitMs = rateLimitMs;
    this.defaultMaxResults = defaultMaxResults;
    this.lastRequestTime = 0;
  }

  /** Enforce rate limit */
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
   * Internal fetch helper
   * @param {string} searchQuery - Keyword or topic query
   * @param {number} maxResults
   */
  async #fetchResults(searchQuery, maxResults) {
    await this.#rateLimit();

    const limit = maxResults ?? this.defaultMaxResults;
    const queryUrl = `${this.baseUrl}/paper/search?query=${encodeURIComponent(
      searchQuery
    )}&limit=${limit}&fields=title,authors,year,venue,url,abstract`;

    try {
      const response = await fetch(queryUrl);

      if (!response.ok) {
        console.error("Semantic Scholar API failed:", response.status, response.statusText);
        throw new Error(`Failed to fetch papers: ${response.statusText}`);
      }

      const data = await response.json();
      const entries = data.data || [];

      return entries.map((entry) => ({
        id: entry.paperId,
        title: entry.title?.trim(),
        summary: entry.abstract?.trim() || "No abstract available.",
        published: entry.year ? `${entry.year}-01-01T00:00:00Z` : "Unknown",
        authors: Array.isArray(entry.authors)
          ? entry.authors.map((a) => a.name)
          : [],
        link: entry.url || null,
      }));
      } catch (err) {
      console.error("Fetch failed:", err);
      return []; // Return empty array instead of throwing
    }
  }

  /**
   * Query papers by topic
   * (Semantic Scholar doesn’t have true categories, so this just searches keywords)
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


// APIHandlerInterface.js
import ArxivAPI from "./ArxivAPI.js";
import SemanticScholarAPI from "./SemanticScholarAPI.js";
// import PubMedAPI from "./PubMedAPI.js"; // optional
// Note: Cache interface relies on server-only deps (firebase-admin).
// To keep the client bundle browser-safe, we disable cache usage in the client.

export default class APIHandlerInterface {
  constructor({ maxResults = 5 } = {}) {
    this.apis = [
      new ArxivAPI({ defaultMaxResults: maxResults }),
      new SemanticScholarAPI({ defaultMaxResults: maxResults }),
      // new PubMedAPI({ defaultMaxResults: maxResults })
    ];
    this.maxResults = maxResults;
    this.cache = null; // Cache disabled in client bundle
  }

  // ----------------------
  // Cache helpers
  // ----------------------
  async getFromCache(userId, query, type = "keyword") {
    if (!this.cache) return null;

    const getter = type === "topic"
      ? this.cache.getRecentPapers
      : this.cache.getRecentQueries;

    try {
      const results = await getter(userId, { limit: this.maxResults, match: query, type });
      if (results && results.length) {
        console.log(`Cache hit for ${type} "${query}"`);
        return results;
      }
      console.log(`Cache miss for ${type} "${query}"`);
    } catch (error) {
      console.warn("Failed to read from cache", error);
    }
    return null;
  }

  async addToCache(userId, query, results, type = "keyword") {
    if (!this.cache || !results || !results.length) return;

    try {
      if (type === "topic") {
        await Promise.all(results.map((item) => this.cache.addRecentPaper(userId, item)));
      } else {
        const queryPayload = {
          query,
          type,
          performedAt: new Date().toISOString(),
          resultsCount: results.length
        };
        await this.cache.addRecentQuery(userId, queryPayload);
      }
      console.log(`Added ${results.length} results to cache for ${type} "${query}"`);
    } catch (error) {
      console.warn("Failed to write to cache", error);
    }
  }

  // ----------------------
  // Main query function
  // ----------------------
  async makeQuery(query, options = { type: "keyword" }) {
    const { type, userId = "global" } = options;

    // Try cache first
    const cached = await this.getFromCache(userId, query, type);
    if (cached) return cached;

    let combinedResults = [];
    for (const api of this.apis) {
      try {
        let results = [];
        if (type === "topic" && typeof api.queryByTopic === "function") {
          results = await api.queryByTopic(query, this.maxResults);
        } else if (type === "keyword" && typeof api.queryByKeyword === "function") {
          results = await api.queryByKeyword(query, this.maxResults);
        }
        combinedResults.push(...results);
      } catch (err) {
        console.warn(`${api.constructor.name} failed:`, err.message);
      }
    }

    // Deduplicate by paper ID
    const uniqueResults = Object.values(
      combinedResults.reduce((acc, r) => {
        acc[r.id] = r;
        return acc;
      }, {})
    );

    // Add to cache
    await this.addToCache(userId, query, uniqueResults, type);

    return uniqueResults;
  }
}

// APIHandlerInterface.js
import ArxivAPI from "./ArxivAPI.js";
import OpenAlexAPI from "./OpenAlexAPI.js";
// import createCacheInterface from "../cache-db/cacheInterface.js";

export default class APIHandlerInterface {
  constructor({ maxResults = 5, cacheOptions = {}  } = {}) {
    this.apis = [
      new ArxivAPI({ defaultMaxResults: maxResults }),
      new OpenAlexAPI({ defaultMaxResults: maxResults }),
    ];
    this.maxResults = maxResults;
    this.cache = cacheOptions.cacheClient || null; // Cache disabled in client bundle
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
      const results = await getter.call(this.cache, userId, {
        limit: this.maxResults,
        match: query,
        type
      });
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
  async makeQuery(query, options = { type: "keyword", forceRefresh: false }) {
    const { type, userId = "global", forceRefresh = false } = options;

    // Try cache first
    let cached = null;
    if (!forceRefresh) {
      cached = await this.getFromCache(userId, query, type);
      if (cached) return cached;
    }

    // Run all API calls in parallel for better performance
    const apiPromises = this.apis.map(async (api) => {
      try {
        let results = [];
        if (type === "topic" && typeof api.queryByTopic === "function") {
          results = await api.queryByTopic(query, this.maxResults);
        } else if (type === "keyword" && typeof api.queryByKeyword === "function") {
          console.log("trying...");
          results = await api.queryByKeyword(query, this.maxResults);
          console.log("results", results);
        }
        return results;
      } catch (err) {
        console.warn(`${api.constructor.name} failed:`, err.message);
        return []; // Return empty array on error
      }
    });

    // Wait for all API calls to complete (or timeout)
    const apiResults = await Promise.allSettled(apiPromises);
    const combinedResults = apiResults
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value);

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

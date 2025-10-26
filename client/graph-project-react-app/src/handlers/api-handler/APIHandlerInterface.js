// APIHandlerInterface.js
import ArxivAPI from "./ArxivAPI.js";
import SemanticScholarAPI from "./SemanticScholarAPI.js";
// import PubMedAPI from "./PubMedAPI.js"; // optional
// Firebase DB stub
// This is our stub!  In reality, replace with actual Firebase SDK
const cacheDB = {
  topic: {},
  keyword: {}
};

export default class APIHandlerInterface {
  constructor({ maxResults = 5 } = {}) {
    this.apis = [
      new ArxivAPI({ defaultMaxResults: maxResults }),
      new SemanticScholarAPI({ defaultMaxResults: maxResults }),
      // new PubMedAPI({ defaultMaxResults: maxResults })
    ];
    this.maxResults = maxResults;
  }

  // ----------------------
  // Cache helpers
  // ----------------------
  async getFromCache(query, type = "keyword") {
    if (!cacheDB[type]) cacheDB[type] = {};
    if (cacheDB[type][query]) {
      console.log(`Cache hit for ${type} "${query}"`);
      return cacheDB[type][query];
    }
    console.log(`Cache miss for ${type} "${query}"`);
    return null;
  }

  async addToCache(query, results, type = "keyword") {
    if (!cacheDB[type]) cacheDB[type] = {};
    cacheDB[type][query] = results;
    console.log(`Added ${results.length} results to cache for ${type} "${query}"`);
  }

  // ----------------------
  // Main query function
  // ----------------------
  async makeQuery(query, options = { type: "keyword" }) {
    const { type } = options;

    // Try cache first
    const cached = await this.getFromCache(query, type);
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
    await this.addToCache(query, uniqueResults, type);

    return uniqueResults;
  }
}

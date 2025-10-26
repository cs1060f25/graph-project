// APIHandlerInterface.js
import ArxivAPI from "./ArxivAPI.js";
import SemanticScholarAPI from "./SemanticScholarAPI.js";
// import PubMedAPI from "./PubMedAPI.js"; // optional
// Firebase DB stub
// This is our stub!  In reality, replace with actual Firebase SDK
const cacheDB = {};

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
  async getFromCache(query) {
    // Replace with real DB lookup later
    if (cacheDB[query]) {
      console.log(`Cache hit for "${query}"`);
      return cacheDB[query];
    }
    console.log(`Cache miss for "${query}"`);
    return null;
  }

  async addToCache(query, results) {
    // Scaffold for Firebase insertion
    cacheDB[query] = results;
    console.log(`Added ${results.length} results to cache for "${query}"`);
  }

  // ----------------------
  // Main query function
  // ----------------------
  async makeQuery(query, options = { type: "keyword" }) {
    // Try cache first
    const cached = await this.getFromCache(query);
    if (cached) return cached;

    let combinedResults = [];
    for (const api of this.apis) {
      try {
        let results = [];
        if (options.type === "topic" && typeof api.queryByTopic === "function") {
          results = await api.queryByTopic(query, this.maxResults);
        } else if (options.type === "keyword" && typeof api.queryByKeyword === "function") {
          results = await api.queryByKeyword(query, this.maxResults);
        }
        combinedResults.push(...results);
      } catch (err) {
        console.warn(`${api.constructor.name} failed:`, err.message);
      }
    }

    // Optional: deduplicate by paper ID
    const uniqueResults = Object.values(
      combinedResults.reduce((acc, r) => {
        acc[r.id] = r;
        return acc;
      }, {})
    );

    // Add to cache
    await this.addToCache(query, uniqueResults);

    return uniqueResults;
  }
}

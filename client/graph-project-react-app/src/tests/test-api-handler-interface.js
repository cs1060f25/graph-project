// how to run: from root project, run:
// node src/tests/test-api-handler-interface.js

import 'dotenv/config';
import assert from "assert";
import APIHandlerInterface from "../handlers/api-handler/APIHandlerInterface.js";

class FakeCacheClient {
  constructor() {
    this.addRecentQueryCalls = [];
    this.addRecentPaperCalls = [];
    this.getRecentQueriesCalls = [];
    this.getRecentPapersCalls = [];
  }

  async addRecentQuery(userId, payload) {
    this.addRecentQueryCalls.push({ userId, payload });
    return { userId, payload };
  }

  async addRecentPaper(userId, payload) {
    this.addRecentPaperCalls.push({ userId, payload });
    return { userId, payload };
  }

  async getRecentQueries(userId, options = {}) {
    this.getRecentQueriesCalls.push({ userId, options });
    return [];
  }

  async getRecentPapers(userId, options = {}) {
    this.getRecentPapersCalls.push({ userId, options });
    return [];
  }
}

async function testSingleQuery() {
  console.log("\n=== Test: Keyword Query ===");
  const apiInterface = new APIHandlerInterface({ maxResults: 3 });

  const results = await apiInterface.makeQuery("graph neural networks", { type: "keyword" });
  console.log("Results returned:", results.length);
  if (results.length) console.log("Sample:", results[0]);
}

async function testTopicQuery() {
  console.log("\n=== Test: Topic Query ===");
  const apiInterface = new APIHandlerInterface({ maxResults: 3 });

  const results = await apiInterface.makeQuery("cs.AI", { type: "topic" });
  console.log("Topic results returned:", results.length);
  if (results.length) console.log("Sample:", results[0]);
}

async function testCacheBehavior() {
  console.log("\n=== Test: Cache Behavior ===");
  const apiInterface = new APIHandlerInterface({ maxResults: 2 });

  // First call: should be a cache miss
  console.log("First call for quantum computing.  Expect cache miss...");
  await apiInterface.makeQuery("quantum computing", { type: "keyword" });

  // Second call: should hit cache
  console.log("Second call for quantum computing.  Expect cache hit...");
  const cachedResults = await apiInterface.makeQuery("quantum computing", { type: "keyword" });
  console.log("Cached results returned:", cachedResults.length);
  if (cachedResults.length) console.log("Sample from cache:", cachedResults[0]);
}

async function testKeywordCacheWritesOnce() {
  console.log("\n=== Test: Keyword Cache Writes Once ===");

  const fakeCache = new FakeCacheClient();
  const apiInterface = new APIHandlerInterface({
    maxResults: 3,
    cacheOptions: { cacheClient: fakeCache }
  });

  apiInterface.apis = [
    {
      queryByKeyword: async () => [
        { id: "r1", title: "Result 1" },
        { id: "r2", title: "Result 2" },
        { id: "r3", title: "Result 3" }
      ]
    }
  ];

  const userId = "user-123";
  await apiInterface.makeQuery("graph neural networks", { type: "keyword", userId });

  assert.strictEqual(fakeCache.addRecentQueryCalls.length, 1, "should cache keyword query once");
  assert.strictEqual(fakeCache.addRecentPaperCalls.length, 0, "keyword queries must not write papers");

  const { payload } = fakeCache.addRecentQueryCalls[0];
  assert.strictEqual(payload.query, "graph neural networks");
  assert.strictEqual(payload.type, "keyword");
  assert.strictEqual(payload.resultsCount, 3);
  assert.ok(payload.performedAt, "performedAt timestamp should be set");
}

async function runAllTests() {
  await testSingleQuery();
  await testTopicQuery();
  await testCacheBehavior();
  await testKeywordCacheWritesOnce();

  console.log("\n✅ All APIHandlerInterface tests complete!");
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

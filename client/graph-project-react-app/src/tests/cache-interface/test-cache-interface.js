import assert from "assert";
import path from "path";
import { fileURLToPath } from "url";

import createCacheInterface from "../../handlers/cache-db/cacheInterface.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(__dirname, "../../../serviceAccountKey.json");

class FakeCache {
  constructor() {
    this.calls = {
      addRecentPaper: [],
      getRecentPapers: [],
      addRecentQuery: [],
      getRecentQueries: []
    };
  }

  async addRecentPaper(userId, paper) {
    this.calls.addRecentPaper.push({ userId, paper });
    return { userId, paper };
  }

  async getRecentPapers(userId, options = {}) {
    this.calls.getRecentPapers.push({ userId, options });
    return [{ userId, ...options }];
  }

  async addRecentQuery(userId, query) {
    this.calls.addRecentQuery.push({ userId, query });
    return { userId, query };
  }

  async getRecentQueries(userId, options = {}) {
    this.calls.getRecentQueries.push({ userId, options });
    return [{ userId, ...options }];
  }
}

function setupInterface() {
  const fakeCache = new FakeCache();
  const cacheInterface = createCacheInterface({ cacheClient: fakeCache });
  return { cacheInterface, fakeCache };
}

async function testCrudDelegation() {
  console.log("\n=== Test: cache interface delegates CRUD to cache client ===");

  const { cacheInterface, fakeCache } = setupInterface();

  const userId = "user-1";
  const paper = { paperId: "paper-123" };
  const query = { query: "graph" };

  await cacheInterface.addRecentPaper(userId, paper);
  await cacheInterface.getRecentPapers(userId, { limit: 3 });
  await cacheInterface.addRecentQuery(userId, query);
  await cacheInterface.getRecentQueries(userId, { limit: 5 });

  assert.strictEqual(fakeCache.calls.addRecentPaper.length, 1, "addRecentPaper should be called once");
  assert.deepStrictEqual(fakeCache.calls.addRecentPaper[0], { userId, paper });

  assert.strictEqual(fakeCache.calls.getRecentPapers.length, 1, "getRecentPapers should be called once");
  assert.deepStrictEqual(fakeCache.calls.getRecentPapers[0], { userId, options: { limit: 3 } });

  assert.strictEqual(fakeCache.calls.addRecentQuery.length, 1, "addRecentQuery should be called once");
  assert.deepStrictEqual(fakeCache.calls.addRecentQuery[0], { userId, query });

  assert.strictEqual(fakeCache.calls.getRecentQueries.length, 1, "getRecentQueries should be called once");
  assert.deepStrictEqual(fakeCache.calls.getRecentQueries[0], { userId, options: { limit: 5 } });
}

async function testPaperSavedListener() {
  console.log("\n=== Test: paperSavedListener pushes papers into cache ===");

  const { cacheInterface, fakeCache } = setupInterface();

  const payload = {
    userId: "user-2",
    paper: { paperId: "paper-456" }
  };

  await cacheInterface.paperSavedListener(payload);

  assert.strictEqual(fakeCache.calls.addRecentPaper.length, 1, "paperSavedListener should call addRecentPaper");
  assert.deepStrictEqual(fakeCache.calls.addRecentPaper[0], { userId: payload.userId, paper: payload.paper });
}

async function testPaperSavedListenerValidation() {
  console.log("\n=== Test: paperSavedListener validates payload ===");

  const { cacheInterface } = setupInterface();

  await assert.rejects(
    () => cacheInterface.paperSavedListener({ paper: { paperId: "missing-user" } }),
    /paperSavedListener requires userId and paper/
  );

  await assert.rejects(
    () => cacheInterface.paperSavedListener({ userId: "user-3" }),
    /paperSavedListener requires userId and paper/
  );
}

async function testQueryListener() {
  console.log("\n=== Test: queryListener pushes queries into cache ===");

  const { cacheInterface, fakeCache } = setupInterface();

  const payload = {
    userId: "user-4",
    query: { query: "gnn", type: "keyword" }
  };

  await cacheInterface.queryListener(payload);

  assert.strictEqual(fakeCache.calls.addRecentQuery.length, 1, "queryListener should call addRecentQuery");
  assert.deepStrictEqual(fakeCache.calls.addRecentQuery[0], { userId: payload.userId, query: payload.query });
}

async function testKeywordQueryResultsCacheOnce() {
  console.log("\n=== Test: keyword queries store once per search ===");

  const { cacheInterface, fakeCache } = setupInterface();

  const payload = {
    userId: "user-6",
    query: {
      query: "gnn",
      type: "keyword",
      performedAt: new Date().toISOString(),
      resultsCount: 3
    }
  };

  await cacheInterface.addRecentQuery(payload.userId, payload.query);

  assert.strictEqual(fakeCache.calls.addRecentQuery.length, 1, "should invoke addRecentQuery once");
  const { query } = fakeCache.calls.addRecentQuery[0];
  assert.strictEqual(query.resultsCount, 3, "resultsCount should reflect result size");
  assert.ok(query.performedAt, "performedAt timestamp must be present");
}

async function testQueryListenerValidation() {
  console.log("\n=== Test: queryListener validates payload ===");

  const { cacheInterface } = setupInterface();

  await assert.rejects(
    () => cacheInterface.queryListener({ query: { query: "missing-user" } }),
    /queryListener requires userId and query/
  );

  await assert.rejects(
    () => cacheInterface.queryListener({ userId: "user-5" }),
    /queryListener requires userId and query/
  );
}

async function testFirestoreIntegration() {
  console.log("\n=== Test: Firestore integration for manual verification ===");

  let cacheInterface;
  try {
    cacheInterface = createCacheInterface({ serviceAccountPath });
  } catch (error) {
    console.warn("Skipping Firestore integration test:", error.message);
    console.warn("Ensure serviceAccountKey.json exists at the project root or set serviceAccountPath.");
    return;
  }

  const userId = `cache-interface-${Date.now()}`;
  const paper = {
    paperId: `paper-${Date.now()}`,
    title: "Cache Interface Manual Verification",
    summary: "Test write for cache interface integration",
    authors: ["Cache Tester"],
    publishedAt: new Date().toISOString(),
    source: "integration-test",
    userActions: { viewed: true }
  };

  await cacheInterface.paperSavedListener({ userId, paper });
  console.log(
    `[Firestore] recentPapers doc created at user-cache/${userId}/recentPapers/${paper.paperId}`
  );

  const papers = await cacheInterface.getRecentPapers(userId, { limit: 5 });
  console.log("[Firestore] Retrieved recentPapers entries:", papers);

  assert.ok(Array.isArray(papers));
  assert.ok(papers.some((item) => item.paperId === paper.paperId));

  const query = {
    query: `manual-${Date.now()}`,
    type: "keyword",
    performedAt: new Date().toISOString(),
    filters: { manual: true },
    resultsCount: 1
  };

  await cacheInterface.queryListener({ userId, query });
  console.log(
    `[Firestore] recentQueries doc created at user-cache/${userId}/recentQueries/${query.type}-${query.query}`
  );

  const queries = await cacheInterface.getRecentQueries(userId, { limit: 5 });
  console.log("[Firestore] Retrieved recentQueries entries:", queries);

  assert.ok(Array.isArray(queries));
  assert.ok(queries.some((item) => item.query === query.query));

  console.log(
    "[Firestore] Use the above doc paths within the Firebase console to manually inspect persisted records."
  );
}

async function run() {
  try {
    await testCrudDelegation();
    await testPaperSavedListener();
    await testPaperSavedListenerValidation();
    await testQueryListener();
    await testQueryListenerValidation();
    await testKeywordQueryResultsCacheOnce();
    await testFirestoreIntegration();
    console.log("\n✅ Cache interface tests complete (expected to fail until implementation).");
  } catch (error) {
    console.error("\n❌ Cache interface tests failed");
    console.error(error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

// how to run: from project root run:
// node src/tests/cache-db/test-firebase-cache.js

import assert from "assert";
import path from "path";
import { fileURLToPath } from "url";

import {
  validateRecentPaper,
  validateRecentQuery,
  sanitizeRecentQuery
} from "../../../../client/graph-project-react-app/src/handlers/cache-db/schemas.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, "../../../../serviceAccountKey.json");

async function testSchemaValidation() {
  console.log("\n=== Test: Schema Validation ===");

  const validPaper = {
    paperId: "arxiv:1234",
    title: "Sample Paper",
    summary: "A summary",
    authors: ["Alice", "Bob"],
    publishedAt: new Date().toISOString(),
    source: "arxiv",
    userActions: { viewed: true }
  };

  const validQuery = {
    query: "graph neural networks",
    type: "keyword",
    performedAt: new Date().toISOString(),
    filters: { field: "cs.AI" },
    resultsCount: 10
  };

  assert.doesNotThrow(() => validateRecentPaper(validPaper));
  assert.doesNotThrow(() => validateRecentQuery(validQuery));

  const invalidPaper = { ...validPaper, authors: "not-an-array" };
  assert.throws(() => validateRecentPaper(invalidPaper), /must be a valid array/);

  const invalidQuery = { ...validQuery, performedAt: "not-a-date" };
  assert.throws(() => validateRecentQuery(invalidQuery), /must be a valid date/);
}

async function testSanitizeRecentQuery() {
  console.log("\n=== Test: Query Sanitization ===");

  const rawQuery = {
    query: "graph neural networks",
    type: "keyword",
    performedAt: new Date().toISOString(),
    filters: { field: "cs.AI" },
    resultsCount: 12,
    unexpected: "should be removed"
  };

  const sanitized = sanitizeRecentQuery(rawQuery);

  assert.strictEqual(sanitized.query, rawQuery.query);
  assert.strictEqual(sanitized.type, rawQuery.type);
  assert.strictEqual(sanitized.performedAt, rawQuery.performedAt);
  assert.strictEqual(sanitized.resultsCount, rawQuery.resultsCount);
  assert.ok(!Object.prototype.hasOwnProperty.call(sanitized, "unexpected"));
}

async function testFirebaseCacheOperations() {
  console.log("\n=== Test: Firebase Cache Operations ===");

  const { default: FirebaseCache } = await import("../../../../client/graph-project-react-app/src/handlers/cache-db/FirebaseCache.js");

  const cache = new FirebaseCache({ serviceAccountPath });

  const testUserId = "test-user";
  const testPaper = {
    paperId: `test-${Date.now()}`,
    title: "Integration Test Paper",
    authors: ["Integration"],
    publishedAt: new Date().toISOString(),
    source: "test"
  };

  await cache.addRecentPaper(testUserId, testPaper);
  const papers = await cache.getRecentPapers(testUserId);
  assert.ok(Array.isArray(papers));
  assert.ok(papers.some((paper) => paper.paperId === testPaper.paperId));

  const testQuery = {
    query: `integration-${Date.now()}`,
    type: "keyword",
    performedAt: new Date().toISOString()
  };

  await cache.addRecentQuery(testUserId, testQuery);
  const queries = await cache.getRecentQueries(testUserId);
  assert.ok(Array.isArray(queries));
  assert.ok(queries.some((item) => item.query === testQuery.query));
}

async function run() {
  try {
    await testSchemaValidation();
    await testSanitizeRecentQuery();
    await testFirebaseCacheOperations();
    console.log("\n✅ Cache DB tests complete!");
  } catch (error) {
    console.error("\n❌ Cache DB tests failed");
    console.error(error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}


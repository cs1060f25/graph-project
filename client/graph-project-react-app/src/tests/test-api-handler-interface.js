// how to run: from root project, run:
// node src/tests/test-api-handler-interface.js

import APIHandlerInterface from "../handlers/api-handler/APIHandlerInterface.js";

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

async function testCacheBehaviorKeyword() {
  console.log("\n=== Test: Cache Behavior Keyword ===");
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

async function testCacheBehaviorTopic() {
  console.log("\n=== Test: Cache Behavior Topic ===");
  const apiInterface = new APIHandlerInterface({ maxResults: 2 });

  // First call: should be a cache miss
  console.log("First call for quantum computing.  Expect cache miss...");
  await apiInterface.makeQuery("quantum computing", { type: "topic" });

  // Second call: should hit cache
  console.log("Second call for quantum computing.  Expect cache hit...");
  const cachedResults = await apiInterface.makeQuery("quantum computing", { type: "topic" });
  console.log("Cached results returned:", cachedResults.length);
  if (cachedResults.length) console.log("Sample from cache:", cachedResults[0]);
}

async function runAllTests() {
  await testSingleQuery();
  await testTopicQuery();
  await testCacheBehaviorKeyword();
  await testCacheBehaviorTopic();

  console.log("\n✅ All APIHandlerInterface tests complete!");
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

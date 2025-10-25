// src/tests/test_arxiv.js
// how to run: from root project, run:
// node src/tests/test_arxiv.js

import ArxivAPI from "../handlers/api-handler/ArxivAPI.js";
import SemanticScholarAPI from "../handlers/api-handler/SemanticScholarAPI.js";

async function testArxiv() {
  console.log("=== Testing ArxivAPI ===");
  const arxiv = new ArxivAPI({ defaultMaxResults: 2 });

  let res = await arxiv.queryByTopic("cs.AI");
  console.log("Topic query returned:", res.length, "results");
  if (res.length) {
    console.log("Sample:", res[0]);
  }

  res = await arxiv.queryByKeyword("quantum computing", 3);
  console.log("Keyword query returned:", res.length, "results");
  if (res.length) {
    console.log("Sample:", res[0]);
  }
}

async function testSemanticScholar() {
  console.log("\n=== Testing SemanticScholarAPI ===");
  const semantic = new SemanticScholarAPI({ defaultMaxResults: 5 });

  // Wait 1 second before first request
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // topic test
  const topicResults = await semantic.queryByTopic("artificial intelligence", 3);
  console.log("Topic query returned:", topicResults.length, "results");
  if (topicResults.length) {
    console.log("Topic sample:", topicResults[0]);
  }

  // Wait 1 second before next request
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // keyword test
  const keywordResults = await semantic.queryByKeyword("machine learning", 5);
  console.log(`Keyword query returned: ${keywordResults.length} papers:`);
  if (keywordResults.length) {
    console.log("Keyword sample:", keywordResults[0]);
  }
}

async function runTests() {
  await testArxiv();
  console.log("\n✅ Arxiv tests complete!");
  await testSemanticScholar();
  console.log("\n✅ Semantic Scholar tests complete!");
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

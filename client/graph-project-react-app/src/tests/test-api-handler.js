// how to run: from root project, run:
// node src/tests/test-api-handler.js

import 'dotenv/config';
import CoreAPI from "../handlers/api-handler/CoreAPI.js";
import ArxivAPI from "../handlers/api-handler/ArxivAPI.js";
import OpenAlexAPI from "../handlers/api-handler/OpenAlexAPI.js";

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

export async function testOpenAlex() {
  console.log("=== Testing OpenAlexAPI ===");

  const openalex = new OpenAlexAPI({ defaultMaxResults: 3 });

  try {
    console.log("\n--- Query by Topic: artificial intelligence ---");
    let res = await openalex.queryByTopic("artificial intelligence");
    console.log("Topic query returned:", res.length, "results");
    if (res.length) console.log("Sample result:", res[0]);
  } catch (err) {
    console.error("Error during topic query:", err);
  }

  try {
    console.log("\n--- Query by Keyword: deep learning ---");
    let res = await openalex.queryByKeyword("deep learning", 5);
    console.log("Keyword query returned:", res.length, "results");
    if (res.length) console.log("Sample result:", res[0]);
  } catch (err) {
    console.error("Error during keyword query:", err);
  }

  console.log("\n=== Done Testing OpenAlexAPI ===");
}

async function testCoreAPI() {
  console.log("=== Testing CoreAPI ===");

  const core = new CoreAPI({ defaultMaxResults: 3 });

  try {
    console.log("\n--- Query by Topic: artificial intelligence ---");
    let res = await core.queryByTopic("artificial intelligence");
    console.log("Topic query returned:", res.length, "results");
    if (res.length) console.log("Sample result:", res[0]);
  } catch (err) {
    console.error("Error during topic query:", err);
  }

  try {
    console.log("\n--- Query by Keyword: machine learning ---");
    let res = await core.queryByKeyword("machine learning", 5);
    console.log("Keyword query returned:", res.length, "results");
    if (res.length) console.log("Sample result:", res[0]);
  } catch (err) {
    console.error("Error during keyword query:", err);
  }

  console.log("\n=== Done Testing CoreAPI ===");
}

async function runTests() {
  await testArxiv();
  console.log("\n✅ Arxiv tests complete!");
  await testOpenAlex();
  console.log("\n✅ Open Alex tests complete!");
  await testCoreAPI();
  console.log("\n✅ CORE API tests complete!");
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

// server/user-db-interface/tests/testQueryHistory.js
// Tests for query history functionality

import { addQueryHistory, getQueryHistory, clearQueryHistory } from '../queryHistory.js';
import { db } from '../../user-db-component/firebaseConfig.js';

// Test user ID
const testUid = 'test-query-history-user';

/**
 * Helper to clean up test data
 */
async function cleanupTestData() {
  try {
    const queryHistoryRef = db.collection('users').doc(testUid).collection('queryHistory');
    const snapshot = await queryHistoryRef.get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

/**
 * Test: Add query history returns complete data with timestamp
 */
async function testAddQueryHistoryReturnsTimestamp() {
  console.log('\n=== Test: Add query history returns timestamp ===');
  
  try {
    const queryData = {
      query: 'test neural networks',
      type: 'keyword',
      resultCount: 42
    };

    const result = await addQueryHistory(testUid, queryData);
    
    console.log('Result:', JSON.stringify(result, null, 2));

    // Verify success
    if (!result.success) {
      throw new Error(`Expected success=true, got: ${result.success}`);
    }

    // Verify returned data has id
    if (!result.data.id) {
      throw new Error('Expected data.id to be present');
    }

    // Verify returned data has timestamp (critical for bug fix)
    if (!result.data.timestamp) {
      throw new Error('Expected data.timestamp to be present');
    }

    // Verify timestamp is a number
    if (typeof result.data.timestamp !== 'number') {
      throw new Error(`Expected timestamp to be a number, got: ${typeof result.data.timestamp}`);
    }

    // Verify timestamp is recent (within last 5 seconds)
    const now = Date.now();
    const timeDiff = now - result.data.timestamp;
    if (timeDiff < 0 || timeDiff > 5000) {
      throw new Error(`Expected recent timestamp, got diff of ${timeDiff}ms`);
    }

    // Verify returned data has createdAt
    if (!result.data.createdAt) {
      throw new Error('Expected data.createdAt to be present');
    }

    // Verify other fields
    if (result.data.query !== queryData.query) {
      throw new Error(`Expected query="${queryData.query}", got: ${result.data.query}`);
    }
    
    if (result.data.type !== queryData.type) {
      throw new Error(`Expected type="${queryData.type}", got: ${result.data.type}`);
    }
    
    if (result.data.resultCount !== queryData.resultCount) {
      throw new Error(`Expected resultCount=${queryData.resultCount}, got: ${result.data.resultCount}`);
    }

    console.log('✓ Test passed: addQueryHistory returns complete data with timestamp');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    return false;
  }
}

/**
 * Test: Get query history includes timestamp
 */
async function testGetQueryHistoryIncludesTimestamp() {
  console.log('\n=== Test: Get query history includes timestamp ===');
  
  try {
    // Add a query first
    await addQueryHistory(testUid, {
      query: 'test query for fetch',
      type: 'topic',
      resultCount: 10
    });

    // Fetch history
    const result = await getQueryHistory(testUid, 10);
    
    console.log('Result:', JSON.stringify(result, null, 2));

    // Verify success
    if (!result.success) {
      throw new Error(`Expected success=true, got: ${result.success}`);
    }

    // Verify data is array
    if (!Array.isArray(result.data)) {
      throw new Error('Expected data to be an array');
    }

    // Verify at least one item
    if (result.data.length === 0) {
      throw new Error('Expected at least one history item');
    }

    // Check first item has timestamp
    const item = result.data[0];
    if (!item.timestamp) {
      throw new Error('Expected history item to have timestamp');
    }

    if (typeof item.timestamp !== 'number') {
      throw new Error(`Expected timestamp to be a number, got: ${typeof item.timestamp}`);
    }

    console.log('✓ Test passed: getQueryHistory includes timestamp');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    return false;
  }
}

/**
 * Test: Clear query history
 */
async function testClearQueryHistory() {
  console.log('\n=== Test: Clear query history ===');
  
  try {
    // Add a few queries
    await addQueryHistory(testUid, { query: 'test 1', type: 'keyword', resultCount: 5 });
    await addQueryHistory(testUid, { query: 'test 2', type: 'keyword', resultCount: 3 });

    // Verify they exist
    const beforeClear = await getQueryHistory(testUid);
    if (beforeClear.data.length === 0) {
      throw new Error('Expected queries to exist before clear');
    }

    // Clear history
    const clearResult = await clearQueryHistory(testUid);
    if (!clearResult.success) {
      throw new Error('Expected clear to succeed');
    }

    // Verify they're gone
    const afterClear = await getQueryHistory(testUid);
    if (afterClear.data.length !== 0) {
      throw new Error(`Expected 0 queries after clear, got: ${afterClear.data.length}`);
    }

    console.log('✓ Test passed: clearQueryHistory works correctly');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    return false;
  }
}

/**
 * Test: Invalid user ID
 */
async function testInvalidUserId() {
  console.log('\n=== Test: Invalid user ID ===');
  
  try {
    const result = await addQueryHistory('', { query: 'test', type: 'keyword' });
    
    if (result.success) {
      throw new Error('Expected failure for invalid user ID');
    }

    if (!result.error) {
      throw new Error('Expected error message');
    }

    console.log('✓ Test passed: Invalid user ID rejected');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    return false;
  }
}

/**
 * Test: Missing query text
 */
async function testMissingQueryText() {
  console.log('\n=== Test: Missing query text ===');
  
  try {
    const result = await addQueryHistory(testUid, { type: 'keyword' });
    
    if (result.success) {
      throw new Error('Expected failure for missing query text');
    }

    if (!result.error || !result.error.includes('Query text is required')) {
      throw new Error('Expected "Query text is required" error');
    }

    console.log('✓ Test passed: Missing query text rejected');
    return true;
  } catch (error) {
    console.error('✗ Test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   QUERY HISTORY TESTS                            ║');
  console.log('╚══════════════════════════════════════════════════╝');

  // Clean up before tests
  await cleanupTestData();

  const results = [];
  
  results.push(await testAddQueryHistoryReturnsTimestamp());
  results.push(await testGetQueryHistoryIncludesTimestamp());
  results.push(await testClearQueryHistory());
  results.push(await testInvalidUserId());
  results.push(await testMissingQueryText());

  // Clean up after tests
  await cleanupTestData();

  // Summary
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;

  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   TEST SUMMARY                                   ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed!');
    throw new Error(`${failed} test(s) failed`);
  } else {
    console.log('\n✓ All tests passed!');
  }
}

/**
 * Export for test runner integration
 */
export async function runQueryHistoryTests() {
  await runAllTests();
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

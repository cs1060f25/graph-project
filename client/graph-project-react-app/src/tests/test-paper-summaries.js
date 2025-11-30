// client/src/tests/test-paper-summaries.js
// Tests for paper summary generation and caching
// how to run: from client/graph-project-react-app, run:
// node src/tests/test-paper-summaries.js

import 'dotenv/config';
import { generatePaperSummary } from '../services/aiSummaryService.js';

async function testGenerateSummary() {
  console.log('=== Testing Paper Summary Generation ===');

  const mockPaperData = {
    title: 'Attention Is All You Need',
    authors: ['Vaswani, A.', 'Shazeer, N.', 'Parmar, N.'],
    summary: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms.',
    year: 2017,
    citations: 85000
  };

  try {
    console.log('\n--- Testing summary generation ---');
    const result = await generatePaperSummary(mockPaperData);

    if (result.success) {
      console.log('✓ Summary generated successfully');
      console.log('Summary:', result.summary);
      console.log('Summary length:', result.summary.length, 'characters');
    } else {
      console.log('✗ Summary generation failed:', result.error);
    }
  } catch (error) {
    console.error('Error during summary generation:', error);
  }
}

async function testErrorHandling() {
  console.log('\n=== Testing Error Handling ===');

  // Test missing API key scenario
  console.log('\n--- Testing with missing paper data ---');
  try {
    const result = await generatePaperSummary(null);
    if (!result.success && result.error) {
      console.log('✓ Error handling works for missing data:', result.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  // Test with minimal paper data
  console.log('\n--- Testing with minimal paper data ---');
  try {
    const result = await generatePaperSummary({
      title: 'Test Paper'
    });
    if (result.success || result.error) {
      console.log('✓ Handled minimal data:', result.success ? 'Generated' : result.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testCacheBehavior() {
  console.log('\n=== Testing Cache Behavior ===');
  console.log('Note: Cache behavior should be tested in React component tests');
  console.log('This test verifies that the service can be called multiple times');
  
  const mockPaperData = {
    title: 'Cache Test Paper',
    authors: ['Author 1'],
    summary: 'Test abstract'
  };

  try {
    // First call
    console.log('\n--- First call ---');
    const result1 = await generatePaperSummary(mockPaperData);
    console.log('First call:', result1.success ? 'Success' : result1.error);

    // Second call (would be cached in hook, but service generates fresh)
    console.log('\n--- Second call (service always generates, hook caches) ---');
    const result2 = await generatePaperSummary(mockPaperData);
    console.log('Second call:', result2.success ? 'Success' : result2.error);
    
    console.log('\n✓ Service can be called multiple times');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('Testing Paper Summary Functionality');
  console.log('='.repeat(60));

  await testGenerateSummary();
  await testErrorHandling();
  await testCacheBehavior();

  console.log('\n' + '='.repeat(60));
  console.log('Tests completed');
  console.log('='.repeat(60));
  console.log('\nNote: For full hook testing with caching, use React Testing Library');
  console.log('in a component test environment.\n');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { testGenerateSummary, testErrorHandling, testCacheBehavior };

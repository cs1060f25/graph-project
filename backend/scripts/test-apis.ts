#!/usr/bin/env tsx
/**
 * Test script to verify external API endpoints are working correctly
 * Run with: tsx scripts/test-apis.ts
 */

import axios from 'axios';
import { searchArxiv } from '../services/arxiv_service.js';
import { searchOpenalex } from '../services/openalex_service.js';
import { searchCore } from '../services/core_service.js';

async function testArxiv() {
  console.log('\n=== Testing Arxiv API ===');
  try {
    const testQuery = 'machine learning';
    console.log(`Query: "${testQuery}"`);
    console.log(`Expected URL: https://export.arxiv.org/api/query?search_query=${encodeURIComponent(testQuery)}&start=0&max_results=10`);
    
    const results = await searchArxiv(testQuery, 10, 0, '');
    console.log(`✅ Arxiv API: SUCCESS - Found ${results.length} papers`);
    if (results.length > 0) {
      console.log(`   First result: "${results[0].title}"`);
    }
    return true;
  } catch (error: any) {
    console.error(`❌ Arxiv API: FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   URL: ${error.config?.url}`);
      console.error(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return false;
  }
}

async function testOpenAlex() {
  console.log('\n=== Testing OpenAlex API ===');
  try {
    const testQuery = 'machine learning';
    console.log(`Query: "${testQuery}"`);
    console.log(`Expected URL: https://api.openalex.org/works?search=${encodeURIComponent(testQuery)}&per-page=10`);
    
    const results = await searchOpenalex(testQuery, 10);
    console.log(`✅ OpenAlex API: SUCCESS - Found ${results.length} papers`);
    if (results.length > 0) {
      console.log(`   First result: "${results[0].title}"`);
    }
    return true;
  } catch (error: any) {
    console.error(`❌ OpenAlex API: FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   URL: ${error.config?.url}`);
      console.error(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return false;
  }
}

async function testCore() {
  console.log('\n=== Testing CORE API ===');
  try {
    const apiKey = process.env.CORE_API_KEY;
    if (!apiKey) {
      console.log('⚠️  CORE API: SKIPPED - CORE_API_KEY not set');
      return null;
    }
    
    const testQuery = 'machine learning';
    console.log(`Query: "${testQuery}"`);
    console.log(`Expected URL: https://api.core.ac.uk/v3/search/works?query=${encodeURIComponent(testQuery)}&limit=10`);
    
    const results = await searchCore(testQuery, 10, '');
    console.log(`✅ CORE API: SUCCESS - Found ${results.length} papers`);
    if (results.length > 0) {
      console.log(`   First result: "${results[0].title}"`);
    }
    return true;
  } catch (error: any) {
    console.error(`❌ CORE API: FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   URL: ${error.config?.url}`);
      console.error(`   Response: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    return false;
  }
}

async function testDirectArxivCall() {
  console.log('\n=== Testing Arxiv API Direct Call ===');
  try {
    const testQuery = 'machine learning';
    const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(testQuery)}&start=0&max_results=10`;
    console.log(`Direct URL: ${url}`);
    
    const response = await axios.get(url, { timeout: 15000 });
    console.log(`✅ Direct Arxiv Call: SUCCESS`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    console.log(`   Response length: ${response.data.length} chars`);
    
    // Check if it's XML
    if (typeof response.data === 'string' && response.data.includes('<?xml')) {
      console.log(`   ✅ Valid XML response`);
    } else {
      console.log(`   ⚠️  Response doesn't appear to be XML`);
      console.log(`   First 200 chars: ${response.data.substring(0, 200)}`);
    }
    return true;
  } catch (error: any) {
    console.error(`❌ Direct Arxiv Call: FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data).substring(0, 500)}`);
    }
    return false;
  }
}

async function testDirectOpenAlexCall() {
  console.log('\n=== Testing OpenAlex API Direct Call ===');
  try {
    const testQuery = 'machine learning';
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(testQuery)}&per-page=10`;
    console.log(`Direct URL: ${url}`);
    
    const response = await axios.get(url, { timeout: 15000 });
    console.log(`✅ Direct OpenAlex Call: SUCCESS`);
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    
    if (response.data && typeof response.data === 'object') {
      console.log(`   ✅ Valid JSON response`);
      console.log(`   Results count: ${response.data.results?.length || 0}`);
    } else {
      console.log(`   ⚠️  Response doesn't appear to be JSON`);
      console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}`);
    }
    return true;
  } catch (error: any) {
    console.error(`❌ Direct OpenAlex Call: FAILED`);
    console.error(`   Error: ${error.message}`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data).substring(0, 500)}`);
    }
    return false;
  }
}

async function main() {
  console.log('🔍 Testing External API Endpoints\n');
  console.log('='.repeat(60));
  
  const results = {
    arxiv: await testArxiv(),
    openalex: await testOpenAlex(),
    core: await testCore(),
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('\n=== Direct API Call Tests ===');
  
  const directResults = {
    arxiv: await testDirectArxivCall(),
    openalex: await testDirectOpenAlexCall(),
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Arxiv Service: ${results.arxiv ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   OpenAlex Service: ${results.openalex ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   CORE Service: ${results.core === null ? '⚠️  SKIP' : results.core ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Direct Arxiv Call: ${directResults.arxiv ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Direct OpenAlex Call: ${directResults.openalex ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.arxiv && results.openalex && (results.core === null || results.core);
  console.log(`\n${allPassed ? '✅' : '❌'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}

main().catch(console.error);


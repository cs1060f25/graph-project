function testArxivAPI() {
  console.log('%c ArXiv API Connection Test', 'font-weight: bold; font-size: 16px; color: purple;');
  
  // Test parameters
  const testQuery = 'quantum computing';
  const maxResults = 3;
  
  // Determine which approach is being used
  console.log('Detecting API configuration...');
  
  // Function to make the test request
  async function makeTestRequest(url) {
    console.log(`Testing request to: ${url}`);
    
    try {
      const startTime = performance.now();
      
      const response = await fetch(url);
      const endTime = performance.now();
      const timeElapsed = (endTime - startTime).toFixed(0);
      
      // Check response status
      if (response.ok) {
        console.log(`%c SUCCESS: Response received (${timeElapsed}ms)`, 'color: green; font-weight: bold;');
        console.log(`Status: ${response.status} ${response.statusText}`);
        
        // Check content type
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);
        
        // Try to parse response based on content type
        let data;
        if (contentType && contentType.includes('application/xml')) {
          const text = await response.text();
          console.log(`%c XML Response Preview (first 300 chars):`, 'font-weight: bold;');
          console.log(text.substring(0, 300) + '...');
          
          // Check if it contains expected ArXiv elements
          const hasEntries = text.includes('<entry>');
          const hasTitle = text.includes('<title>');
          const hasAuthor = text.includes('<author>');
          
          if (hasEntries && hasTitle && hasAuthor) {
            console.log('%c VALID ARXIV RESPONSE: Contains expected XML elements', 'color: green; font-weight: bold;');
          } else {
            console.log('%c WARNING: Response may not be valid ArXiv data', 'color: orange; font-weight: bold;');
          }
        } else if (contentType && contentType.includes('application/json')) {
          data = await response.json();
          console.log('JSON Response:', data);
        } else {
          const text = await response.text();
          console.log('Text Response Preview:', text.substring(0, 300) + '...');
        }
        
        return { success: true, status: response.status, contentType };
      } else {
        console.log(`%c ERROR: Request failed with status ${response.status}`, 'color: red; font-weight: bold;');
        
        // Try to get more details about the error
        try {
          const errorText = await response.text();
          console.log('Error details:', errorText.substring(0, 500));
        } catch (e) {
          console.log('Could not read error details');
        }
        
        return { success: false, status: response.status };
      }
    } catch (error) {
      console.log(`%c EXCEPTION: ${error.message}`, 'color: red; font-weight: bold;');
      return { success: false, error: error.message };
    }
  }
  
  // Test different possible endpoints
  async function runTests() {
    console.log('%c Testing direct ArXiv API (likely to fail due to CORS)...', 'font-style: italic;');
    const directResult = await makeTestRequest(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(testQuery)}&start=0&max_results=${maxResults}`);
    
    console.log('\n%c Testing local proxy on port 5002...', 'font-style: italic;');
    const localProxyResult = await makeTestRequest(`http://localhost:5002/api/arxiv?query=${encodeURIComponent(testQuery)}&type=keyword&maxResults=${maxResults}`);
    
    console.log('\n%c Testing CORS proxy...', 'font-style: italic;');
    const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(testQuery)}&start=0&max_results=${maxResults}`)}`;
    const corsProxyResult = await makeTestRequest(corsProxyUrl);
    
    // Summary
    console.log('\n%c === TEST SUMMARY ===', 'font-weight: bold; font-size: 16px; color: purple;');
    console.log(`Direct ArXiv API: ${directResult.success ? 'SUCCESS' : 'FAILED'} (${directResult.status || directResult.error || 'unknown'})`);
    console.log(`Local Proxy (port 5002): ${localProxyResult.success ? 'SUCCESS' : 'FAILED'} (${localProxyResult.status || localProxyResult.error || 'unknown'})`);
    console.log(`CORS Proxy: ${corsProxyResult.success ? 'SUCCESS' : 'FAILED'} (${corsProxyResult.status || corsProxyResult.error || 'unknown'})`);
    
    // Recommendation
    console.log('\n%c === RECOMMENDATION ===', 'font-weight: bold; font-size: 14px; color: blue;');
    if (localProxyResult.success) {
      console.log('Use your local proxy on port 5002. Update ArxivAPI.js to use: http://localhost:5002/api/arxiv');
    } else if (corsProxyResult.success) {
      console.log('Use the CORS proxy temporarily. Update ArxivAPI.js to use the CORS proxy pattern.');
      console.log('   But for production, fix your local proxy server.');
    } else {
      console.log('All methods failed. Check your network connection and server configuration.');
    }
  }
  
  // Run all tests
  runTests();
}

// Execute the test
testArxivAPI();
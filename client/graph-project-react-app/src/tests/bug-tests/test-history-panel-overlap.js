function checkHistoryTabPosition() {
  console.log('Checking if history tab is above results section...');
  
  // Find history panel - using multiple possible selectors
  const historyPanel = document.querySelector('.history-body') ||
                       document.querySelector('#history-body') ||
                       document.querySelector('[class*="history"]');
  
  // Find results section specifically
  const resultsSection = document.querySelector('.graph-section') ||
                         document.querySelector('#graph-section') ||
                         document.querySelector('[class*="results"]');
  
  if (!historyPanel) {
    console.error('ERROR: Could not find history panel');
    return;
  }
  
  if (!resultsSection) {
    console.error('ERROR: Could not find results section');
    return;
  }
  
  // Get bounding rectangles
  const historyRect = historyPanel.getBoundingClientRect();
  const resultsRect = resultsSection.getBoundingClientRect();
  
  // Check if history is above results
  const historyIsAbove = historyRect.bottom <= resultsRect.top;
  
  // Print results
  console.log('%c Position Test Results:', 'font-weight: bold; font-size: 16px;');
  console.log(`History panel (${historyPanel.className}): Top=${historyRect.top.toFixed(0)}, Bottom=${historyRect.bottom.toFixed(0)}`);
  console.log(`Results section (${resultsSection.className}): Top=${resultsRect.top.toFixed(0)}, Bottom=${resultsRect.bottom.toFixed(0)}`);
  
  if (historyIsAbove) {
    console.log('%c PASS: History panel is above results section', 'color: green; font-weight: bold;');
  } else {
    console.log('%c NOTE: History panel is not above results section', 'color: blue; font-weight: bold;');
    console.log(`Distance between history bottom and results top: ${(resultsRect.top - historyRect.bottom).toFixed(0)}px`);
  }
  
  // Highlight the elements briefly
  const historyOutline = document.createElement('div');
  historyOutline.style.position = 'absolute';
  historyOutline.style.top = historyRect.top + 'px';
  historyOutline.style.left = historyRect.left + 'px';
  historyOutline.style.width = historyRect.width + 'px';
  historyOutline.style.height = historyRect.height + 'px';
  historyOutline.style.border = '2px solid blue';
  historyOutline.style.zIndex = '9999';
  historyOutline.style.pointerEvents = 'none';
  document.body.appendChild(historyOutline);
  
  const resultsOutline = document.createElement('div');
  resultsOutline.style.position = 'absolute';
  resultsOutline.style.top = resultsRect.top + 'px';
  resultsOutline.style.left = resultsRect.left + 'px';
  resultsOutline.style.width = resultsRect.width + 'px';
  resultsOutline.style.height = resultsRect.height + 'px';
  resultsOutline.style.border = '2px solid green';
  resultsOutline.style.zIndex = '9999';
  resultsOutline.style.pointerEvents = 'none';
  document.body.appendChild(resultsOutline);
  
  // Remove outlines after 5 seconds
  setTimeout(() => {
    historyOutline.remove();
    resultsOutline.remove();
  }, 5000);
  
  return {
    historyIsAbove,
    historyRect,
    resultsRect
  };
}

// Run the check
checkHistoryTabPosition();
// user-db-interface/index.js
// Main export file for the User DB Interface Layer

// Export all functions from specialized modules
export { getUserFolders, addUserFolder } from './folders.js';
export { addSavedPaper, getSavedPapers } from './papers.js';
export { subscribeToFolders, subscribeToSavedPapers } from './subscriptions.js';
export { getUserData } from './user.js';
export { addQueryHistory, getQueryHistory, clearQueryHistory } from './queryHistory.js';

// Export utility functions for external use
export { createResponse, validateUserId, validatePaperData, validateFolderName, validateCallback } from './utils.js';

// Export test function
export { testInterface } from './testInterface.js';

# User DB Interface Layer

This module provides a clean API layer between the frontend (React client) and the Firebase User Database for the GRAPHENE project.

## Overview

The interface layer is organized into specialized modules and standardizes all user database operations while providing real-time data streaming capabilities using Firebase's `onSnapshot` listeners.

## Module Structure

- **`folders.js`** - Folder management functions
- **`papers.js`** - Saved papers functions  
- **`subscriptions.js`** - Real-time subscription functions
- **`user.js`** - User data functions
- **`utils.js`** - Shared utility functions
- **`index.js`** - Main export file

## Installation

```bash
cd server/user-db-interface
npm install
```

## API Functions

### Core Functions

#### `getUserFolders(uid)`
Retrieves all folder data for a given user.

**Parameters:**
- `uid` (string): User ID

**Returns:** Promise resolving to standardized response:
```javascript
{ success: true, data: [folder1, folder2, ...], error: null }
```

#### `addSavedPaper(uid, paperData)`
Adds a paper to the user's saved papers collection.

**Parameters:**
- `uid` (string): User ID
- `paperData` (object): Paper data with required fields:
  - `title` (string): Paper title
  - `authors` (array): List of authors
  - `link` (string): Paper URL

**Returns:** Promise resolving to standardized response with paper ID.

#### `getSavedPapers(uid)`
Retrieves all saved papers for a given user.

**Parameters:**
- `uid` (string): User ID

**Returns:** Promise resolving to standardized response with papers array.

#### `subscribeToFolders(uid, onChangeCallback)`
Sets up a real-time listener for folder changes.

**Parameters:**
- `uid` (string): User ID
- `onChangeCallback` (function): Callback function to handle data changes

**Returns:** Unsubscribe function to stop listening.

#### `subscribeToSavedPapers(uid, onChangeCallback)`
Sets up a real-time listener for saved papers changes.

**Parameters:**
- `uid` (string): User ID
- `onChangeCallback` (function): Callback function to handle data changes

**Returns:** Unsubscribe function to stop listening.

### Helper Functions

#### `addUserFolder(uid, folderName)`
Adds a new folder for the user.

#### `getUserData(uid)`
Retrieves user data including preferences.

## Response Format

All functions return a standardized JSON response:

```javascript
{
  success: boolean,    // Whether the operation was successful
  data: any,          // The data payload (null if error)
  error: string|null  // Error message (null if success)
}
```

## Usage Example

```javascript
import { 
  getUserFolders, 
  addSavedPaper, 
  subscribeToFolders 
} from './index.js';

// Or import from specific modules:
import { getUserFolders } from './folders.js';
import { addSavedPaper } from './papers.js';
import { subscribeToFolders } from './subscriptions.js';

// Get user folders
const foldersResult = await getUserFolders('user-123');
if (foldersResult.success) {
  console.log('Folders:', foldersResult.data);
} else {
  console.error('Error:', foldersResult.error);
}

// Add a saved paper
const paperData = {
  title: "Graph Neural Networks",
  authors: ["John Doe", "Jane Smith"],
  link: "https://example.com/paper1"
};

const addResult = await addSavedPaper('user-123', paperData);
if (addResult.success) {
  console.log('Paper added:', addResult.data);
}

// Set up real-time subscription
const unsubscribe = subscribeToFolders('user-123', (response) => {
  if (response.success) {
    console.log('Folders updated:', response.data);
  } else {
    console.error('Subscription error:', response.error);
  }
});

// Later, clean up
unsubscribe();
```

## Testing

The interface layer includes comprehensive tests organized by module:

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:folders      # Folder management tests
npm run test:papers       # Saved papers tests
npm run test:subscriptions # Real-time subscription tests
npm run test:user         # User data tests
```

### Test Structure
- **`tests/testUtils.js`** - Shared test utilities
- **`tests/testFolders.js`** - Folder function tests
- **`tests/testPapers.js`** - Papers function tests
- **`tests/testSubscriptions.js`** - Subscription tests
- **`tests/testUser.js`** - User data tests
- **`tests/testRunner.js`** - Main test runner

See `tests/README.md` for detailed testing documentation.

## Error Handling

All functions include comprehensive error handling:
- Input validation
- Firebase error catching
- Graceful error responses
- Console logging for debugging

## Dependencies

- Firebase v10.7.1
- Firestore for database operations
- Firebase Auth for user management

## Security

The interface layer relies on Firestore security rules to ensure users can only access their own data. Make sure your Firestore rules are properly configured in `/server/user-db/firestore.rules`.

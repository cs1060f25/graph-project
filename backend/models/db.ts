// Database models and validation

export interface User {
  id: string; // uid
  email: string;
  createdAt: number; // timestamp
  preferences: Record<string, any>; // flexible preferences object
}

export interface Folder {
  id: string; // document ID
  name: string;
  createdAt: number; // timestamp
}

export interface SavedPaper {
  id: string; // document ID
  paper_id?: string; // original paper ID from search results (e.g., arxiv ID)
  title: string;
  summary: string; // matches Paper model
  published: string; // matches Paper model
  authors: string[]; // array of author names
  link: string; // URL to paper
  source?: string; // 'arxiv', 'core', 'openalex' - matches Paper model
  similarity?: number; // semantic similarity score - matches Paper model
  starred: boolean; // default false
  folderId: string | null; // reference to folder, null if no folder
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface QueryHistory {
  id: string; // document ID
  query: string; // search query text
  type: string; // 'keyword' | 'topic' | etc.
  resultCount: number; // number of results returned
  timestamp: number; // timestamp
  createdAt: string; // ISO string
}

// Validation functions

export function validateUserId(uid: string): void {
  if (!uid || typeof uid !== 'string' || uid.trim().length === 0) {
    throw new Error('User ID is required and must be a non-empty string');
  }
}

export function validateFolderName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new Error('Folder name is required and must be a string');
  }
  
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new Error('Folder name cannot be empty or only whitespace');
  }
  
  if (trimmedName.length > 100) {
    throw new Error('Folder name cannot exceed 100 characters');
  }
  
  if (/[\n\t\r]/.test(trimmedName)) {
    throw new Error('Folder name cannot contain newlines, tabs, or carriage returns');
  }
}

export function validatePaperData(paperData: Partial<SavedPaper>): void {
  if (!paperData || typeof paperData !== 'object') {
    throw new Error('Paper data is required and must be an object');
  }

  const requiredFields = ['title', 'authors', 'link'];
  const missingFields = requiredFields.filter(field => !paperData[field as keyof SavedPaper]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Validate optional fields if provided
  if (paperData.starred !== undefined && typeof paperData.starred !== 'boolean') {
    throw new Error('starred must be a boolean');
  }

  if (paperData.folderId !== undefined && paperData.folderId !== null && typeof paperData.folderId !== 'string') {
    throw new Error('folderId must be a string or null');
  }

  if (paperData.summary !== undefined && typeof paperData.summary !== 'string') {
    throw new Error('summary must be a string');
  }

  if (paperData.published !== undefined && typeof paperData.published !== 'string') {
    throw new Error('published must be a string');
  }

  if (paperData.source !== undefined && typeof paperData.source !== 'string') {
    throw new Error('source must be a string');
  }

  if (paperData.similarity !== undefined && typeof paperData.similarity !== 'number') {
    throw new Error('similarity must be a number');
  }

  if (paperData.paper_id !== undefined && typeof paperData.paper_id !== 'string') {
    throw new Error('paper_id must be a string');
  }

  if (!Array.isArray(paperData.authors) || paperData.authors.length === 0) {
    throw new Error('authors must be a non-empty array');
  }

  if (typeof paperData.title !== 'string' || paperData.title.trim().length === 0) {
    throw new Error('title must be a non-empty string');
  }

  if (typeof paperData.link !== 'string' || paperData.link.trim().length === 0) {
    throw new Error('link must be a non-empty string');
  }
}

export function validateQueryHistoryData(queryData: Partial<QueryHistory>): void {
  if (!queryData || typeof queryData !== 'object') {
    throw new Error('Query data is required and must be an object');
  }

  if (!queryData.query || typeof queryData.query !== 'string') {
    throw new Error('Query text is required');
  }

  if (queryData.resultCount !== undefined && (typeof queryData.resultCount !== 'number' || queryData.resultCount < 0)) {
    throw new Error('resultCount must be a non-negative number');
  }
}

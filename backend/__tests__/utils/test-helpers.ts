// Test utilities and helpers
import type { User, Folder, SavedPaper, QueryHistory } from '../../models/db.js';

export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-uid-123',
    email: 'test@example.com',
    createdAt: Date.now(),
    preferences: {},
    ...overrides,
  };
}

export function createMockFolder(overrides?: Partial<Folder>): Folder {
  return {
    id: 'folder-123',
    name: 'Test Folder',
    createdAt: Date.now(),
    ...overrides,
  };
}

export function createMockSavedPaper(overrides?: Partial<SavedPaper>): SavedPaper {
  return {
    id: 'paper-123',
    paper_id: 'arxiv:1234.5678',
    title: 'Test Paper',
    summary: 'This is a test paper summary',
    published: '2024-01-01',
    authors: ['Author One', 'Author Two'],
    link: 'https://example.com/paper',
    source: 'arxiv',
    starred: false,
    folderId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function createMockQueryHistory(overrides?: Partial<QueryHistory>): QueryHistory {
  return {
    id: 'history-123',
    query: 'test query',
    type: 'keyword',
    resultCount: 10,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockPaper(overrides?: any) {
  return {
    paper_id: 'test-paper-123',
    title: 'Test Paper Title',
    summary: 'Test paper summary',
    published: '2024-01-01',
    authors: ['Author One'],
    link: 'https://example.com/paper',
    source: 'arxiv',
    similarity: 0.85,
    ...overrides,
  };
}

export function generateRandomUid(): string {
  return `test-uid-${Math.random().toString(36).substring(2, 15)}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


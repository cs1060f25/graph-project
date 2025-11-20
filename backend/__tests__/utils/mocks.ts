// Mock implementations for external dependencies
import { vi } from 'vitest';

// Firebase Admin mocks
export function createFirebaseMocks() {
  const mockDoc = {
    exists: true,
    id: 'test-id',
    data: vi.fn(() => ({})),
    get: vi.fn(),
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ref: {},
  };

  const mockCollection = {
    doc: vi.fn(() => mockDoc),
    add: vi.fn(() => Promise.resolve({ id: 'new-id', ...mockDoc })),
    get: vi.fn(() => Promise.resolve({
      docs: [],
      empty: true,
      forEach: vi.fn(),
    })),
    orderBy: vi.fn(() => mockCollection),
    limit: vi.fn(() => mockCollection),
    where: vi.fn(() => mockCollection),
  };

  const mockFirestore = {
    collection: vi.fn(() => mockCollection),
    batch: vi.fn(() => ({
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn(() => Promise.resolve()),
    })),
  };

  const mockAuth = {
    verifyIdToken: vi.fn(() => Promise.resolve({
      uid: 'test-uid',
      email: 'test@example.com',
    })),
    createUser: vi.fn(),
    deleteUser: vi.fn(),
  };

  return {
    mockDoc,
    mockCollection,
    mockFirestore,
    mockAuth,
  };
}

// Google GenAI mocks
export function createGenAIMocks() {
  const mockEmbedding = {
    embeddings: [{
      values: Array(768).fill(0).map(() => Math.random()),
    }],
  };

  const mockGenerateContent = {
    text: JSON.stringify({
      arxiv_queries: [{ query: 'test', mode: 'keyword' }],
      openalex_queries: [],
      core_queries: [],
    }),
  };

  const mockModels = {
    generateContent: vi.fn(() => Promise.resolve(mockGenerateContent)),
    embedContent: vi.fn(() => Promise.resolve(mockEmbedding)),
  };

  const mockGenAI = {
    models: mockModels,
  };

  return {
    mockGenAI,
    mockModels,
    mockEmbedding,
    mockGenerateContent,
  };
}

// Axios mocks
export function createAxiosMocks() {
  const mockAxiosGet = vi.fn(() => Promise.resolve({
    data: {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }));

  return {
    mockAxiosGet,
  };
}

// Express Request/Response mocks
export function createExpressMocks() {
  const mockRequest = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: undefined,
    uid: undefined,
  } as any;

  const mockResponse = {
    status: vi.fn(() => mockResponse),
    json: vi.fn(() => mockResponse),
    send: vi.fn(() => mockResponse),
    header: vi.fn(() => mockResponse),
  } as any;

  const mockNext = vi.fn();

  return {
    mockRequest,
    mockResponse,
    mockNext,
  };
}


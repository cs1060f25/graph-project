// client/src/setupVitest.js
// Vitest setup file for global test configuration

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-force-graph-2d to avoid Vitest trying to load its ESM bundle from node_modules
// Graph rendering details are not needed for these tests.
vi.mock('react-force-graph-2d', () => {
  return {
    default: function MockForceGraph2D() {
      return null;
    },
  };
});

// Mock d3-force as well to prevent Vitest from trying to parse its ESM source
vi.mock('d3-force', () => {
  return {};
});

// Mock userApi for backend API calls
vi.mock('./services/userApi', () => {
  return {
    userApi: {
      searchPapers: vi.fn().mockResolvedValue([]),
      expandGraphLayer: vi.fn().mockResolvedValue([]),
      generatePaperSummary: vi.fn().mockResolvedValue({
        success: true,
        summary: 'Test summary',
        error: null,
      }),
      getSavedPapers: vi.fn().mockResolvedValue([]),
      savePaper: vi.fn().mockResolvedValue({ success: true, data: {}, error: null }),
      updatePaper: vi.fn().mockResolvedValue({ success: true, data: {}, error: null }),
      deletePaper: vi.fn().mockResolvedValue({ success: true, data: {}, error: null }),
      getQueryHistory: vi.fn().mockResolvedValue([]),
      addQueryHistory: vi.fn().mockResolvedValue({}),
      clearQueryHistory: vi.fn().mockResolvedValue(undefined),
      getFolders: vi.fn().mockResolvedValue([]),
      createFolder: vi.fn().mockResolvedValue({}),
      deleteFolder: vi.fn().mockResolvedValue({}),
      getCurrentUser: vi.fn().mockResolvedValue({}),
      getUserData: vi.fn().mockResolvedValue({}),
      syncUser: vi.fn().mockResolvedValue({ success: true, isNewUser: false, error: null }),
    },
  };
});

// Mock AuthContext's useAuth hook so QueryPage and related components have a stubbed auth state
vi.mock('./contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    token: 'test-token',
    role: 'user',
    loading: false,
    error: null,
    isNewUser: false,
    loginWithEmail: vi.fn(),
    loginWithGoogle: vi.fn(),
    signUpWithEmail: vi.fn(),
    logout: vi.fn(),
    setError: vi.fn(),
    // Legacy method names for compatibility
    signInWithEmail: vi.fn(),
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  })),
  AuthProvider: ({ children }) => children,
}));


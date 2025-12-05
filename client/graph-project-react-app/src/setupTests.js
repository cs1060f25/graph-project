// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Globally mock APIHandlerInterface to avoid importing server-only cache code (firebase-admin)
// Individual tests can override instance behavior as needed
jest.mock('./handlers/api-handler/APIHandlerInterface', () => {
  return jest.fn().mockImplementation(() => ({
    makeQuery: jest.fn().mockResolvedValue([]),
  }));
});

// Mock react-force-graph-2d to avoid Jest trying to load its ESM bundle from node_modules
// Graph rendering details are not needed for these tests.
jest.mock('react-force-graph-2d', () => {
  return function MockForceGraph2D() {
    return null;
  };
});

// Mock d3-force as well to prevent Jest from trying to parse its ESM source
jest.mock('d3-force', () => {
  return {};
});

// Mock AuthContext's useAuth hook so QueryPage and related components have a stubbed auth state
jest.mock('./contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { uid: 'test-user-123', email: 'test@example.com' },
    loading: false,
    signInWithGoogle: jest.fn(),
    signOut: jest.fn(),
  })),
}));

// server/tests/integration/api.integration.test.js
// Integration tests that make real HTTP requests to the API server

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from '../../routes/user.js';
import authRoutes from '../../routes/auth.js';
import papersRoutes from '../../routes/papers.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

// Load environment variables
dotenv.config({ override: true });

// Test server setup
let testServer;
let baseURL;
const TEST_PORT = 5003; // Use different port to avoid conflicts

// Create test app (same as index.js but with test port)
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Root route
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Graphene API Server',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        user: '/api/user',
        papers: '/api/papers'
      }
    });
  });
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });
  
  // Auth routes (no authentication required for bootstrap)
  app.use('/api/auth', authRoutes);
  
  // Protected routes - require authentication
  app.use('/api/user', verifyFirebaseToken, userRoutes);
  app.use('/api/papers', papersRoutes);
  
  return app;
};

// Helper to make authenticated requests
// For integration tests, we'll need a valid Firebase token
// This is a placeholder - in real tests, you'd generate or use a test token
const getAuthToken = () => {
  // In a real integration test environment, you would:
  // 1. Use Firebase Admin SDK to create a test user and token
  // 2. Or use environment variable with a test token
  // 3. Or use Firebase emulator for testing
  return process.env.TEST_FIREBASE_TOKEN || null;
};

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Start test server
    const app = createTestApp();
    
    await new Promise((resolve) => {
      testServer = app.listen(TEST_PORT, () => {
        baseURL = `http://localhost:${TEST_PORT}`;
        console.log(`Test server running on ${baseURL}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Stop test server
    if (testServer) {
      await new Promise((resolve) => {
        testServer.close(() => {
          console.log('Test server stopped');
          resolve();
        });
      });
    }
  });

  describe('Health Check Endpoint', () => {
    it('should return 200 OK with status: ok', async () => {
      const response = await fetch(`${baseURL}/health`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    });

    it('should return correct response structure', async () => {
      const response = await fetch(`${baseURL}/health`);
      const data = await response.json();
      
      // Verify specific structure
      expect(data).toEqual({ status: 'ok' });
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await fetch(`${baseURL}/`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('endpoints');
      expect(data.message).toBe('Graphene API Server');
      expect(data.version).toBe('1.0.0');
      expect(data.endpoints).toHaveProperty('health');
      expect(data.endpoints).toHaveProperty('auth');
      expect(data.endpoints).toHaveProperty('user');
      expect(data.endpoints).toHaveProperty('papers');
    });
  });

  describe('Paper Search Endpoint (Integration)', () => {
    it('should return 401 without authentication token', async () => {
      const response = await fetch(`${baseURL}/api/papers/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: 'machine learning',
          type: 'keyword'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Authorization');
    });

    it('should return 401 with invalid token format', async () => {
      const response = await fetch(`${baseURL}/api/papers/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'InvalidTokenFormat'
        },
        body: JSON.stringify({
          query: 'machine learning',
          type: 'keyword'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      
      expect(data).toHaveProperty('error');
    });

    it('should search papers with valid query and return results (requires TEST_FIREBASE_TOKEN)', async () => {
      const authToken = getAuthToken();
      
      if (!authToken) {
        console.warn('Skipping authenticated test - TEST_FIREBASE_TOKEN not set');
        console.warn('To run this test, set TEST_FIREBASE_TOKEN environment variable with a valid Firebase ID token');
        return;
      }

      const response = await fetch(`${baseURL}/api/papers/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: 'machine learning',
          type: 'keyword',
          maxResults: 5
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('error');
      expect(data.error).toBeNull();
      
      // Verify data structure
      expect(Array.isArray(data.data)).toBe(true);
      
      // If results are returned, verify structure
      if (data.data.length > 0) {
        const firstPaper = data.data[0];
        expect(firstPaper).toHaveProperty('id');
        expect(firstPaper).toHaveProperty('title');
      }
    });

    it('should return 400 for empty query (requires TEST_FIREBASE_TOKEN)', async () => {
      const authToken = getAuthToken();
      
      if (!authToken) {
        console.warn('Skipping authenticated test - TEST_FIREBASE_TOKEN not set');
        return;
      }

      const response = await fetch(`${baseURL}/api/papers/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query: '',
          type: 'keyword'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Query is required');
    });

    it('should return 400 for missing query parameter (requires TEST_FIREBASE_TOKEN)', async () => {
      const authToken = getAuthToken();
      
      if (!authToken) {
        console.warn('Skipping authenticated test - TEST_FIREBASE_TOKEN not set');
        return;
      }

      const response = await fetch(`${baseURL}/api/papers/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          type: 'keyword'
          // Missing query
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('error');
    });
  });

  describe('Auth Bootstrap Endpoint (Integration)', () => {
    it('should return 400 when token is missing', async () => {
      const response = await fetch(`${baseURL}/api/auth/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Token is required');
    });

    it('should return 401 with invalid token', async () => {
      const response = await fetch(`${baseURL}/api/auth/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: 'invalid-token-12345'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Invalid token');
    });

    it('should bootstrap user with valid Firebase token (requires TEST_FIREBASE_TOKEN)', async () => {
      const authToken = getAuthToken();
      
      if (!authToken) {
        console.warn('Skipping authenticated test - TEST_FIREBASE_TOKEN not set');
        console.warn('To run this test, set TEST_FIREBASE_TOKEN environment variable with a valid Firebase ID token');
        return;
      }

      const response = await fetch(`${baseURL}/api/auth/bootstrap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: authToken
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('role');
      expect(data).toHaveProperty('displayName');
      expect(data.role).toBe('user');
    });
  });
});


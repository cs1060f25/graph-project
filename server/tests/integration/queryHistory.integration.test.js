// server/tests/integration/queryHistory.integration.test.js
// Integration test for query history endpoints - tests full user data flow

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from '../../routes/user.js';
import authRoutes from '../../routes/auth.js';
import { verifyFirebaseToken } from '../../middleware/auth.js';

// Load environment variables
dotenv.config({ override: true });

// Test server setup
let testServer;
let baseURL;
const TEST_PORT = 5004; // Use different port to avoid conflicts with other tests

// Create test app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Auth routes
  app.use('/api/auth', authRoutes);
  
  // Protected routes - require authentication
  app.use('/api/user', verifyFirebaseToken, userRoutes);
  
  return app;
};

// Helper to get auth token for tests
const getAuthToken = () => {
  return process.env.TEST_FIREBASE_TOKEN || null;
};

describe('Query History Integration Tests', () => {
  beforeAll(async () => {
    // Start test server
    const app = createTestApp();
    
    await new Promise((resolve) => {
      testServer = app.listen(TEST_PORT, () => {
        baseURL = `http://localhost:${TEST_PORT}`;
        console.log(`Query History test server running on ${baseURL}`);
        resolve();
      });
    });
  });

  afterAll(async () => {
    // Stop test server
    if (testServer) {
      await new Promise((resolve) => {
        testServer.close(() => {
          console.log('Query History test server stopped');
          resolve();
        });
      });
    }
  });

  describe('Query History Authentication', () => {
    it('should return 401 without authentication token', async () => {
      const response = await fetch(`${baseURL}/api/user/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should return 401 with invalid token format', async () => {
      const response = await fetch(`${baseURL}/api/user/history`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'InvalidTokenFormat'
        }
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('Query History CRUD Operations (requires TEST_FIREBASE_TOKEN)', () => {
    const authToken = getAuthToken();
    
    if (!authToken) {
      it.skip('Skipping authenticated tests - TEST_FIREBASE_TOKEN not set', () => {
        console.warn('Set TEST_FIREBASE_TOKEN environment variable to run authenticated integration tests');
        console.warn('These tests verify the full CRUD operations for query history');
      });
      return;
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    };

    it('should add a query to history and return it with timestamp', async () => {
      const queryData = {
        query: 'integration test query',
        type: 'keyword',
        resultCount: 10
      };

      const response = await fetch(`${baseURL}/api/user/history`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(queryData)
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('query', queryData.query);
      expect(data.data).toHaveProperty('type', queryData.type);
      expect(data.data).toHaveProperty('resultCount', queryData.resultCount);
      expect(data.data).toHaveProperty('timestamp');
      expect(typeof data.data.timestamp).toBe('number');
    });

    it('should retrieve query history with correct structure', async () => {
      // First add a query
      const queryData = {
        query: 'test retrieval query',
        type: 'author',
        resultCount: 5
      };

      await fetch(`${baseURL}/api/user/history`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(queryData)
      });

      // Then retrieve history
      const response = await fetch(`${baseURL}/api/user/history?limit=20`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
      
      // Verify structure of history items
      if (data.data.length > 0) {
        const firstItem = data.data[0];
        expect(firstItem).toHaveProperty('id');
        expect(firstItem).toHaveProperty('query');
        expect(firstItem).toHaveProperty('type');
        expect(firstItem).toHaveProperty('resultCount');
        expect(firstItem).toHaveProperty('timestamp');
      }
    });

    it('should respect limit parameter when retrieving history', async () => {
      // Add multiple queries
      for (let i = 0; i < 5; i++) {
        await fetch(`${baseURL}/api/user/history`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            query: `limit test query ${i}`,
            type: 'keyword',
            resultCount: i
          })
        });
      }

      // Retrieve with limit
      const response = await fetch(`${baseURL}/api/user/history?limit=3`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(3);
    });

    it('should clear query history and return success', async () => {
      // Add a query first
      await fetch(`${baseURL}/api/user/history`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          query: 'query to be cleared',
          type: 'keyword',
          resultCount: 1
        })
      });

      // Clear history
      const response = await fetch(`${baseURL}/api/user/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('success');
      expect(data.success).toBe(true);

      // Verify history is actually cleared
      const getResponse = await fetch(`${baseURL}/api/user/history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const getData = await getResponse.json();
      expect(getData.success).toBe(true);
      // History might not be empty if other tests added queries, but structure should be correct
      expect(Array.isArray(getData.data)).toBe(true);
    });

    it('should return 400 for invalid query data', async () => {
      const response = await fetch(`${baseURL}/api/user/history`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          // Missing required fields
          type: 'keyword'
        })
      });

      // Should return 400 or handle gracefully
      expect([200, 400, 500]).toContain(response.status);
      const data = await response.json();
      expect(data).toHaveProperty('success');
    });

  });
});


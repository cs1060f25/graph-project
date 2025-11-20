import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import authRouter from '../../../api/routes/auth.js';
import { auth } from '../../../config/firebase.js';
import * as dbService from '../../../services/db_service.js';

vi.mock('../../../config/firebase.js', () => ({
  auth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock('../../../services/db_service.js', () => ({
  getUser: vi.fn(),
  createUser: vi.fn(),
}));

const mockAuth = vi.mocked(auth);
const mockDbService = vi.mocked(dbService);

describe('Auth Route', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  describe('POST /api/auth/bootstrap', () => {
    it('should bootstrap existing user successfully', async () => {
      const decodedToken = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      const existingUser = {
        id: 'test-uid',
        email: 'test@example.com',
        preferences: { theme: 'dark' },
        createdAt: 1234567890,
      };

      mockAuth.verifyIdToken.mockResolvedValue(decodedToken as any);
      mockDbService.getUser.mockResolvedValue(existingUser as any);

      const response = await request(app)
        .post('/api/auth/bootstrap')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(response.body).toEqual({
        id: 'test-uid',
        email: 'test@example.com',
        preferences: { theme: 'dark' },
      });
      expect(mockDbService.createUser).not.toHaveBeenCalled();
    });

    it('should create new user if not exists', async () => {
      const decodedToken = {
        uid: 'new-uid',
        email: 'new@example.com',
      };

      const newUser = {
        id: 'new-uid',
        email: 'new@example.com',
        preferences: {},
        createdAt: 1234567890,
      };

      mockAuth.verifyIdToken.mockResolvedValue(decodedToken as any);
      mockDbService.getUser.mockResolvedValue(null);
      mockDbService.createUser.mockResolvedValue(newUser as any);

      const response = await request(app)
        .post('/api/auth/bootstrap')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(response.body).toEqual({
        id: 'new-uid',
        email: 'new@example.com',
        preferences: {},
      });
      expect(mockDbService.createUser).toHaveBeenCalledWith('new-uid', 'new@example.com');
    });

    it('should return 400 if token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/bootstrap')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Token is required');
      expect(mockAuth.verifyIdToken).not.toHaveBeenCalled();
    });

    it('should return 400 if token is null', async () => {
      const response = await request(app)
        .post('/api/auth/bootstrap')
        .send({ token: null })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Token is required');
    });

    it('should return 401 if token is invalid', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      const response = await request(app)
        .post('/api/auth/bootstrap')
        .send({ token: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
      expect(mockDbService.getUser).not.toHaveBeenCalled();
    });

    it('should handle user without email', async () => {
      const decodedToken = {
        uid: 'test-uid',
        email: null,
      };

      const user = {
        id: 'test-uid',
        email: '',
        preferences: {},
        createdAt: 1234567890,
      };

      mockAuth.verifyIdToken.mockResolvedValue(decodedToken as any);
      mockDbService.getUser.mockResolvedValue(user as any);

      const response = await request(app)
        .post('/api/auth/bootstrap')
        .send({ token: 'valid-token' })
        .expect(200);

      expect(response.body.email).toBe('');
    });

    it('should handle user creation error', async () => {
      const decodedToken = {
        uid: 'new-uid',
        email: 'new@example.com',
      };

      mockAuth.verifyIdToken.mockResolvedValue(decodedToken as any);
      mockDbService.getUser.mockResolvedValue(null);
      mockDbService.createUser.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/bootstrap')
        .send({ token: 'valid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});


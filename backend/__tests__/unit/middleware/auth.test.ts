import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyFirebaseToken } from '../../../api/middleware/auth.js';
import { auth } from '../../../config/firebase.js';

vi.mock('../../../config/firebase.js', () => ({
  auth: {
    verifyIdToken: vi.fn(),
  },
}));

const mockAuth = vi.mocked(auth);

describe('Auth Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      headers: {},
      user: undefined,
      uid: undefined,
    };

    mockResponse = {
      status: vi.fn(() => mockResponse),
      json: vi.fn(() => mockResponse),
    };

    mockNext = vi.fn();
  });

  describe('verifyFirebaseToken', () => {
    it('should verify valid token and call next', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';
      const decodedToken = {
        uid: 'test-uid',
        email: 'test@example.com',
      };

      mockAuth.verifyIdToken.mockResolvedValue(decodedToken as any);

      await verifyFirebaseToken(mockRequest, mockResponse, mockNext);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(mockRequest.user).toEqual(decodedToken);
      expect(mockRequest.uid).toBe('test-uid');
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header is missing', async () => {
      mockRequest.headers.authorization = undefined;

      await verifyFirebaseToken(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header missing or invalid',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      mockRequest.headers.authorization = 'Invalid token';

      await verifyFirebaseToken(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authorization header missing or invalid',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token verification fails', async () => {
      mockRequest.headers.authorization = 'Bearer invalid-token';
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await verifyFirebaseToken(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should extract token correctly from Bearer header', async () => {
      mockRequest.headers.authorization = 'Bearer token-with-spaces';
      mockAuth.verifyIdToken.mockResolvedValue({ uid: 'test-uid' } as any);

      await verifyFirebaseToken(mockRequest, mockResponse, mockNext);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('token-with-spaces');
    });

    it('should handle token with special characters', async () => {
      mockRequest.headers.authorization = 'Bearer token.123-abc';
      mockAuth.verifyIdToken.mockResolvedValue({ uid: 'test-uid' } as any);

      await verifyFirebaseToken(mockRequest, mockResponse, mockNext);

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('token.123-abc');
    });
  });
});


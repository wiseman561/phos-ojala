const request = require('supertest');
const { app } = require('../server');
const redis = require('redis');
const { Server } = require('socket.io');
const { createServer } = require('http');
const { mockJwt, mockTokens, mockUser } = require('../../__mocks__/auth');

// Mock Redis client
jest.mock('redis', () => {
  const mockSubscribe = jest.fn();
  const mockConnect = jest.fn().mockResolvedValue();
  const mockDuplicate = jest.fn().mockReturnValue({
    connect: mockConnect,
    subscribe: mockSubscribe
  });
  
  return {
    createClient: jest.fn().mockReturnValue({
      on: jest.fn(),
      connect: mockConnect,
      duplicate: mockDuplicate
    })
  };
});

// Mock JWT using centralized mocks
jest.mock('jsonwebtoken', () => {
  const { mockJwt } = require('../../__mocks__/auth');
  return mockJwt;
});

describe('Alerts Streamer Service', () => {
  describe('HTTP Endpoints', () => {
    test('GET /health should return 200 status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'alerts-streamer');
    });

    test('GET / should return service info', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('service', 'Alerts Streamer Service');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('WebSocket Authentication', () => {
    let io, httpServer;
    
    beforeEach(() => {
      httpServer = createServer();
      io = new Server(httpServer);
    });
    
    afterEach(() => {
      io.close();
      httpServer.close();
    });
    
    test('Should reject connection without token', async () => {
      const mockSocket = {
        handshake: {
          query: {},
          headers: {}
        },
        user: null
      };
      
      const error = await new Promise(resolve => {
        const mockNext = (err) => resolve(err);
        const authMiddleware = io.use.mock.calls[0][0];
        authMiddleware(mockSocket, mockNext);
      });
      
      expect(error).toBeDefined();
      expect(error.message).toBe('Authentication token is required');
    });
    
    test('Should reject connection with invalid token', async () => {
      const mockSocket = {
        handshake: {
          query: { token: 'invalid-token' },
          headers: {}
        },
        user: null
      };
      
      const error = await new Promise(resolve => {
        const mockNext = (err) => resolve(err);
        const authMiddleware = io.use.mock.calls[0][0];
        authMiddleware(mockSocket, mockNext);
      });
      
      expect(error).toBeDefined();
      expect(error.message).toBe('Invalid authentication token');
    });
    
    test('Should accept connection with valid token and role', async () => {
      const mockSocket = {
        handshake: {
          query: { token: mockTokens.accessToken },
          headers: {}
        },
        user: null,
        join: jest.fn()
      };
      
      const result = await new Promise(resolve => {
        const mockNext = (err) => resolve({ error: err, socket: mockSocket });
        const authMiddleware = io.use.mock.calls[0][0];
        authMiddleware(mockSocket, mockNext);
      });
      
      expect(result.error).toBeUndefined();
      expect(result.socket.user).toBeDefined();
      expect(result.socket.user.role).toBe(mockUser.role);
    });
  });

  describe('Redis Subscription', () => {
    test('Should subscribe to emergency-alerts channel', async () => {
      const mockRedisClient = redis.createClient();
      const mockSubscriber = mockRedisClient.duplicate();
      
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
        'emergency-alerts',
        expect.any(Function)
      );
    });
    
    test('Should subscribe to alert-acknowledgments channel', async () => {
      const mockRedisClient = redis.createClient();
      const mockSubscriber = mockRedisClient.duplicate();
      
      expect(mockSubscriber.subscribe).toHaveBeenCalledWith(
        'alert-acknowledgments',
        expect.any(Function)
      );
    });
  });
});

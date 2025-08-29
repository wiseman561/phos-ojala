import { User, AuthContextType } from '../frontend/employer-dashboard/src/types';

// Mock user data
export const mockUser: User = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin'
};

// Mock tokens
export const mockTokens = {
  accessToken: 'mock.access.token',
  refreshToken: 'mock.refresh.token'
};

// Mock auth context for React components
export const mockAuthContext: AuthContextType = {
  isAuthenticated: true,
  user: mockUser,
  login: jest.fn().mockResolvedValue(undefined),
  logout: jest.fn().mockResolvedValue(undefined),
  loading: false,
  error: null
};

// Mock Express middleware functions
export const mockAuthMiddleware = {
  authenticateToken: jest.fn().mockImplementation((req, res, next) => {
    req.user = mockUser;
    next();
  }),
  
  checkRole: (roles: string[]) => 
    jest.fn().mockImplementation((req, res, next) => {
      if (roles.includes(mockUser.role)) {
        next();
      } else {
        res.status(403).json({ error: 'Insufficient permissions' });
      }
    }),

  verifyToken: jest.fn().mockImplementation((token: string) => {
    if (token === mockTokens.accessToken) {
      return Promise.resolve(mockUser);
    }
    throw new Error('Invalid token');
  })
};

// Mock JWT functions
export const mockJwt = {
  sign: jest.fn().mockReturnValue(mockTokens.accessToken),
  verify: jest.fn().mockImplementation((token, secret, callback) => {
    if (token === mockTokens.accessToken) {
      callback(null, mockUser);
    } else {
      callback(new Error('Invalid token'));
    }
  })
};

// Mock socket.io authentication middleware
export const mockSocketAuth = jest.fn().mockImplementation((socket, next) => {
  const token = socket.handshake?.query?.token;
  if (token === mockTokens.accessToken) {
    socket.user = mockUser;
    next();
  } else {
    next(new Error('Authentication failed'));
  }
}); 
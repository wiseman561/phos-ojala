// Mock authentication module for testing

const mockUser = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  preferences: {
    theme: 'light',
    notifications: true
  }
};

const mockTokens = {
  accessToken: 'mock-access-token-12345',
  refreshToken: 'mock-refresh-token-67890',
  tokenType: 'Bearer',
  expiresIn: 3600
};

const mockJwt = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-123', role: 'admin' }),
  decode: jest.fn().mockReturnValue({ userId: 'test-user-123', role: 'admin' })
};

const mockAuthContext = {
  user: mockUser,
  token: mockTokens.accessToken,
  isAuthenticated: true,
  isLoading: false,
  error: null,
  login: jest.fn().mockResolvedValue({
    user: mockUser,
    token: mockTokens.accessToken
  }),
  logout: jest.fn().mockResolvedValue(undefined),
  register: jest.fn().mockResolvedValue({
    user: mockUser,
    token: mockTokens.accessToken
  }),
  clearError: jest.fn()
};

const mockLocalStorage = {
  getItem: jest.fn((key) => {
    if (key === 'authToken') return mockTokens.accessToken;
    if (key === 'user') return JSON.stringify(mockUser);
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock axios responses
const mockAuthResponses = {
  login: {
    data: {
      user: mockUser,
      token: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken
    }
  },
  register: {
    data: {
      user: mockUser,
      token: mockTokens.accessToken,
      refreshToken: mockTokens.refreshToken
    }
  },
  refresh: {
    data: {
      user: mockUser,
      token: 'new-access-token-12345',
      refreshToken: 'new-refresh-token-67890'
    }
  },
  profile: {
    data: {
      user: mockUser
    }
  }
};

module.exports = {
  mockUser,
  mockTokens,
  mockJwt,
  mockAuthContext,
  mockLocalStorage,
  mockAuthResponses
};

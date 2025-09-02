import { authApi } from '../../../../frontend/shared/api/authApi';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Auth API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockResponse = {
      data: {
        token: 'mock.token',
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'employer'
        }
      }
    };

    it('successfully logs in user', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.login(mockCredentials.email, mockCredentials.password);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/auth/login',
        mockCredentials
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('handles login error', async () => {
      const errorMessage = 'Invalid credentials';
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: { message: errorMessage }
        }
      });

      await expect(
        authApi.login(mockCredentials.email, mockCredentials.password)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('register', () => {
    const mockUserData = {
      email: 'new@example.com',
      password: 'password123',
      name: 'New User',
      role: 'employer'
    };

    const mockResponse = {
      data: {
        message: 'User registered successfully',
        user: {
          id: '2',
          ...mockUserData
        }
      }
    };

    it('successfully registers new user', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.register(mockUserData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/auth/register',
        mockUserData
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('handles registration error', async () => {
      const errorMessage = 'Email already exists';
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: { message: errorMessage }
        }
      });

      await expect(authApi.register(mockUserData)).rejects.toThrow(errorMessage);
    });
  });

  describe('logout', () => {
    const mockUserId = '1';

    const mockResponse = {
      data: {
        message: 'Logged out successfully'
      }
    };

    it('successfully logs out user', async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await authApi.logout(mockUserId);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/auth/logout',
        { userId: mockUserId }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('handles logout error', async () => {
      const errorMessage = 'Logout failed';
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: { message: errorMessage }
        }
      });

      await expect(authApi.logout(mockUserId)).rejects.toThrow(errorMessage);
    });
  });

  describe('getProfile', () => {
    const mockProfile = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'employer',
      preferences: {
        theme: 'light',
        notifications: true
      }
    };

    const mockResponse = {
      data: mockProfile
    };

    it('successfully fetches user profile', async () => {
      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await authApi.getProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/profile');
      expect(result).toEqual(mockProfile);
    });

    it('handles profile fetch error', async () => {
      const errorMessage = 'Profile not found';
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          data: { message: errorMessage }
        }
      });

      await expect(authApi.getProfile()).rejects.toThrow(errorMessage);
    });
  });

  describe('error handling', () => {
    it('handles network errors', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network Error'));

      await expect(
        authApi.login('test@example.com', 'password123')
      ).rejects.toThrow('Network Error');
    });

    it('handles server errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Internal server error' }
        }
      });

      await expect(
        authApi.login('test@example.com', 'password123')
      ).rejects.toThrow('Internal server error');
    });

    it('handles timeout errors', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        code: 'ECONNABORTED',
        message: 'Request timeout'
      });

      await expect(
        authApi.login('test@example.com', 'password123')
      ).rejects.toThrow('Request timeout');
    });
  });
});

import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../../../../hooks/useAuth';

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset all mocks
    jest.clearAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('checks for existing session on mount', async () => {
    const mockToken = 'mock.token';
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'employer'
    };

    // Mock localStorage
    localStorage.setItem('token', mockToken);

    // Mock fetch for token validation
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    // Initial state
    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    // After token validation
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('handles invalid token on mount', async () => {
    localStorage.setItem('token', 'invalid.token');

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Invalid token' })
    });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Invalid token');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('handles successful login', async () => {
    const mockToken = 'mock.token';
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'employer'
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: mockToken, user: mockUser })
    });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem('token')).toBe(mockToken);
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage })
    });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrongpassword');
      } catch (error) {
        // Expected error
      }
    });

    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('handles logout', async () => {
    // Setup initial authenticated state
    localStorage.setItem('token', 'mock.token');
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'employer'
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser)
    });

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    // Wait for initial auth check
    await waitForNextUpdate();

    // Perform logout
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('handles network errors during login', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    const { result, waitForNextUpdate } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'password123');
      } catch (error) {
        // Expected error
      }
    });

    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(localStorage.getItem('token')).toBeNull();
  });
}); 
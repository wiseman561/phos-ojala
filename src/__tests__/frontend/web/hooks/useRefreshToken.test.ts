import { renderHook, act } from '@testing-library/react-hooks';
import { useRefreshToken } from '../../../../hooks/useRefreshToken';
import { authApi } from '../../../../frontend/shared/api/authApi';
import { mockAuthResponses } from '../../../../utils/test-utils';

// Mock the API
jest.mock('../../../../frontend/shared/api/authApi', () => ({
  authApi: {
    refresh: jest.fn()
  }
}));

describe('useRefreshToken Hook', () => {
  const mockSetAuthState = jest.fn();
  const mockRedirect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('does nothing when no refresh token exists', () => {
    renderHook(() => useRefreshToken(mockSetAuthState, mockRedirect));

    expect(authApi.refresh).not.toHaveBeenCalled();
    expect(mockSetAuthState).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('attempts to refresh token when one exists', async () => {
    const refreshToken = 'mock.refresh.token';
    localStorage.setItem('refreshToken', refreshToken);

    (authApi.refresh as jest.Mock).mockResolvedValueOnce(mockAuthResponses.refresh.success);

    const { waitForNextUpdate } = renderHook(() =>
      useRefreshToken(mockSetAuthState, mockRedirect)
    );

    await waitForNextUpdate();

    expect(authApi.refresh).toHaveBeenCalledWith(refreshToken);
    expect(mockSetAuthState).toHaveBeenCalledWith({
      token: mockAuthResponses.refresh.success.token,
      user: mockAuthResponses.refresh.success.user
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('handles refresh token failure', async () => {
    const refreshToken = 'invalid.refresh.token';
    localStorage.setItem('refreshToken', refreshToken);

    (authApi.refresh as jest.Mock).mockRejectedValueOnce({
      response: {
        data: mockAuthResponses.refresh.error
      }
    });

    const { waitForNextUpdate } = renderHook(() =>
      useRefreshToken(mockSetAuthState, mockRedirect)
    );

    await waitForNextUpdate();

    expect(authApi.refresh).toHaveBeenCalledWith(refreshToken);
    expect(mockSetAuthState).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/login');
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('handles network errors during refresh', async () => {
    const refreshToken = 'mock.refresh.token';
    localStorage.setItem('refreshToken', refreshToken);

    (authApi.refresh as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { waitForNextUpdate } = renderHook(() =>
      useRefreshToken(mockSetAuthState, mockRedirect)
    );

    await waitForNextUpdate();

    expect(authApi.refresh).toHaveBeenCalledWith(refreshToken);
    expect(mockSetAuthState).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/login');
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('handles malformed refresh token response', async () => {
    const refreshToken = 'mock.refresh.token';
    localStorage.setItem('refreshToken', refreshToken);

    (authApi.refresh as jest.Mock).mockResolvedValueOnce({
      data: { invalid: 'response' }
    });

    const { waitForNextUpdate } = renderHook(() =>
      useRefreshToken(mockSetAuthState, mockRedirect)
    );

    await waitForNextUpdate();

    expect(authApi.refresh).toHaveBeenCalledWith(refreshToken);
    expect(mockSetAuthState).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith('/login');
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('cleans up on unmount', () => {
    const refreshToken = 'mock.refresh.token';
    localStorage.setItem('refreshToken', refreshToken);

    const { unmount } = renderHook(() =>
      useRefreshToken(mockSetAuthState, mockRedirect)
    );

    unmount();

    // Verify cleanup
    expect(localStorage.getItem('refreshToken')).toBe(refreshToken); // Token should still exist
    expect(mockSetAuthState).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('handles concurrent refresh attempts', async () => {
    const refreshToken = 'mock.refresh.token';
    localStorage.setItem('refreshToken', refreshToken);

    (authApi.refresh as jest.Mock).mockImplementation(() =>
      new Promise(resolve => setTimeout(() => resolve(mockAuthResponses.refresh.success), 100))
    );

    const { result, waitForNextUpdate } = renderHook(() =>
      useRefreshToken(mockSetAuthState, mockRedirect)
    );

    // Trigger multiple refresh attempts
    act(() => {
      result.current.refresh();
      result.current.refresh();
      result.current.refresh();
    });

    await waitForNextUpdate();

    // Should only make one API call
    expect(authApi.refresh).toHaveBeenCalledTimes(1);
    expect(mockSetAuthState).toHaveBeenCalledTimes(1);
  });
});

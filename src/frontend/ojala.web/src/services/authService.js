import API from '../api/axios';

export const authService = {
  // Login with email and password
  login: async (email, password, rememberMe = true) => {
    try {
      const response = await API.post("/api/auth/login", {
        email,
        password,
        rememberMe
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Register new user
  register: async (userData) => {
    try {
      const response = await API.post("/api/auth/register", userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await API.get("/api/auth/profile");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  },

  // Logout user
  logout: async (userId) => {
    try {
      const response = await API.post("/api/auth/logout", { userId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Logout failed');
    }
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    try {
      const response = await API.post("/api/auth/refresh", { refreshToken });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Token refresh failed');
    }
  }
};

export default authService;

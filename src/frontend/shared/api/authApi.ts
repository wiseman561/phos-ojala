import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences?: {
    theme: string;
    notifications: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<{ message: string; user: User }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout(userId: string): Promise<{ message: string }> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/logout`, {
        userId
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/profile`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  },

  /**
   * Refresh authentication token
   */
  async refresh(): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }
};

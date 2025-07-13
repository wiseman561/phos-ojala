// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Point Axios to your backend
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AuthContext = createContext();

// Hook for consuming the AuthContext
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken]             = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading]     = useState(true);

  // Initialize auth state when token changes
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Decode token to verify expiration
          const decoded = jwtDecode(token);
          const now = Date.now() / 1000;
          if (decoded.exp < now) {
            // Token expired
            logout();
          } else {
            // Set header for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Attempt to fetch profile; if it 404s, just ignore
            try {
              const resp = await axios.get('/api/auth/profile');
              setCurrentUser(resp.data);
            } catch (err) {
              console.warn('Profile endpoint not available or failed:', err);
            }
          }
        } catch (err) {
          console.error('Failed to decode token:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  // Call during login
  const login = async (email, password, rememberMe = true) => {
    try {
      const { data } = await axios.post('/api/auth/login', {
        email,
        password,
        rememberMe
      });
      const { token: newToken, user } = data;

      // Persist and apply token
      localStorage.setItem('token', newToken);
      setToken(newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      // Store user
      setCurrentUser(user);

      return { success: true };
    } catch (err) {
      console.error('Login failed:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  };

  // Call during registration
  const register = async (userData) => {
    try {
      const { data } = await axios.post('/api/auth/register', userData);
      return { success: true, data };
    } catch (err) {
      console.error('Registration failed:', err);
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please try again.'
      };
    }
  };

  // Clear all auth data
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

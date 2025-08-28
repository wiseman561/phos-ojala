import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Generic User interface that can be extended
export interface BaseUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  roles?: string[];
}

// Extended user interfaces for different apps
export interface NurseUser extends BaseUser {
  nurseId?: string;
  department?: string;
  licenseNumber?: string;
}

export interface EmployerUser extends BaseUser {
  organizationId?: string;
  organizationName?: string;
  employerTitle?: string;
  department?: string;
}

export interface PatientUser extends BaseUser {
  patientId?: string;
  dateOfBirth?: string;
  phone?: string;
}

export type User = NurseUser | EmployerUser | PatientUser | BaseUser;

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register?: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasRole: (requiredRoles: string | string[]) => boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  token?: string; // For backward compatibility
  user?: User;
}

// Configuration interface for different apps
export interface AuthConfig {
  appName: string;
  storageKey: string;
  baseURL: string;
  userRole: string;
  allowedRoles: string[];
  enableRegistration?: boolean;
  roleValidator?: (role: string) => boolean;
  apiClient?: any; // For apps that have their own API client
}

// Predefined role constants
export const NURSE_ROLES = {
  RN: 'RN',
  LPN: 'LPN',
  NURSE_MANAGER: 'NURSE_MANAGER',
  CHARGE_NURSE: 'CHARGE_NURSE',
  STAFF_NURSE: 'STAFF_NURSE',
  PROVIDER: 'PROVIDER'
} as const;

export const EMPLOYER_ROLES = {
  EMPLOYER: 'EMPLOYER',
  HR_MANAGER: 'HR_MANAGER',
  BENEFITS_ADMIN: 'BENEFITS_ADMIN',
  EXECUTIVE: 'EXECUTIVE',
  ORGANIZATION_ADMIN: 'ORGANIZATION_ADMIN',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER'
} as const;

export const PATIENT_ROLES = {
  PATIENT: 'patient'
} as const;

export const ADMIN_ROLES = {
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
  SYSTEM_ADMIN: 'system_admin'
} as const;

export type NurseRole = typeof NURSE_ROLES[keyof typeof NURSE_ROLES];
export type EmployerRole = typeof EMPLOYER_ROLES[keyof typeof EMPLOYER_ROLES];
export type PatientRole = typeof PATIENT_ROLES[keyof typeof PATIENT_ROLES];
export type AdminRole = typeof ADMIN_ROLES[keyof typeof ADMIN_ROLES];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default role validators
const isNurseRole = (role: string): boolean => Object.values(NURSE_ROLES).includes(role as NurseRole);
const isEmployerRole = (role: string): boolean => Object.values(EMPLOYER_ROLES).includes(role as EmployerRole);
const isPatientRole = (role: string): boolean => role === 'patient';
const isAdminRole = (role: string): boolean => Object.values(ADMIN_ROLES).includes(role as AdminRole);

export const createAuthProvider = (config: AuthConfig) => {
  return ({ children }: { children: ReactNode }) => {
    const [tokens, setTokens] = useState<TokenPair | null>(() => {
      const savedTokens = localStorage.getItem(config.storageKey);
      return savedTokens ? JSON.parse(savedTokens) : null;
    });

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!tokens?.accessToken && !!user;

    // Create axios instance for auth calls (use provided client or create new one)
    const authApi: any = config.apiClient || axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Set tokens and update localStorage
    const setAuthTokens = (tokenPair: TokenPair) => {
      localStorage.setItem(config.storageKey, JSON.stringify(tokenPair));
      setTokens(tokenPair);
      authApi.defaults.headers.common.Authorization = `Bearer ${tokenPair.accessToken}`;
    };

    // Clear tokens and localStorage
    const clearAuthTokens = () => {
      localStorage.removeItem(config.storageKey);
      setTokens(null);
      setUser(null);
      delete authApi.defaults.headers.common.Authorization;
    };

    // Role validation function
    const validateRole = (role: string, roles?: string[]): boolean => {
      if (config.roleValidator) {
        return config.roleValidator(role);
      }

      // Check if role or any of the roles array matches allowed roles
      const rolesToCheck = roles ? [role, ...roles] : [role];
      return rolesToCheck.some(r => config.allowedRoles.includes(r));
    };

    // Login function
    const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
      try {
        setIsLoading(true);

        const response = await authApi.post('/api/auth/login', {
          email,
          password,
          role: config.userRole
        });

        const data = response.data;
        let tokenPair: TokenPair;
        let userData: User | undefined;

        if (data.accessToken && data.refreshToken) {
          // New format
          tokenPair = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt || new Date(Date.now() + 3600000).toISOString()
          };
          userData = data.user;
        } else if (data.token) {
          // Legacy format
          tokenPair = {
            accessToken: data.token,
            refreshToken: data.token,
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          };
          userData = data.user;
        } else {
          throw new Error('Invalid response format');
        }

        // Decode user info from token if not provided
        if (!userData && tokenPair.accessToken) {
          try {
            const decoded = jwtDecode(tokenPair.accessToken) as any;
            userData = {
              id: decoded.sub || decoded.userId || 'unknown',
              email: decoded.email || email,
              firstName: decoded.firstName || decoded.given_name,
              lastName: decoded.lastName || decoded.family_name,
              role: decoded.role || config.userRole,
              roles: decoded.roles || [decoded.role || config.userRole]
            };
          } catch (decodeError) {
            console.warn('Failed to decode token:', decodeError);
            userData = {
              id: 'unknown',
              email,
              role: config.userRole,
              roles: [config.userRole]
            };
          }
        }

        // Validate user role
        if (userData && !validateRole(userData.role, userData.roles)) {
          clearAuthTokens();
          return {
            success: false,
            message: `Access denied. Your role '${userData.role}' is not authorized for this application.`
          };
        }

        setAuthTokens(tokenPair);
        setUser(userData || null);
        scheduleRefresh(tokenPair);

        return { success: true };
      } catch (error: any) {
        console.error('Login error:', error);
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Login failed'
        };
      } finally {
        setIsLoading(false);
      }
    };

    // Register function (optional)
    const register = async (userData: RegisterData): Promise<{ success: boolean; message?: string }> => {
      if (!config.enableRegistration) {
        return {
          success: false,
          message: 'Registration is not enabled for this application'
        };
      }

      try {
        setIsLoading(true);

        const response = await authApi.post('/api/auth/register', {
          ...userData,
          role: config.userRole
        });

        const data = response.data;
        let tokenPair: TokenPair;

        if (data.accessToken && data.refreshToken) {
          tokenPair = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt || new Date(Date.now() + 3600000).toISOString()
          };
        } else if (data.token) {
          tokenPair = {
            accessToken: data.token,
            refreshToken: data.token,
            expiresAt: new Date(Date.now() + 3600000).toISOString()
          };
        } else {
          throw new Error('Invalid response format');
        }

        // Decode user info from token
        const decoded = jwtDecode(tokenPair.accessToken) as any;
        const user: User = {
          id: decoded.sub || decoded.userId || 'unknown',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: decoded.role || config.userRole,
          roles: decoded.roles || [decoded.role || config.userRole]
        };

        setAuthTokens(tokenPair);
        setUser(user);
        scheduleRefresh(tokenPair);

        return { success: true };
      } catch (error: any) {
        console.error('Registration error:', error);
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Registration failed'
        };
      } finally {
        setIsLoading(false);
      }
    };

    // Refresh token function
    const refreshToken = async (): Promise<void> => {
      if (!tokens?.refreshToken) {
        clearAuthTokens();
        return;
      }

      try {
        const response = await authApi.post('/api/auth/refresh', {
          refreshToken: tokens.refreshToken
        });

        const data = response.data;
        if (data.accessToken) {
          const newTokenPair: TokenPair = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || tokens.refreshToken,
            expiresAt: data.expiresAt || new Date(Date.now() + 3600000).toISOString()
          };
          setAuthTokens(newTokenPair);
          scheduleRefresh(newTokenPair);
        } else {
          throw new Error('Invalid refresh response');
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        clearAuthTokens();
      }
    };

    // Logout function
    const logout = () => {
      clearAuthTokens();
      // Optionally call logout endpoint
      if (tokens?.accessToken) {
        authApi.post('/api/auth/logout', { refreshToken: tokens.refreshToken }).catch(console.error);
      }
    };

    // Schedule token refresh
    const scheduleRefresh = (tokenPair: TokenPair) => {
      const expiresAt = new Date(tokenPair.expiresAt);
      const now = new Date();
      const timeUntilExpiry = expiresAt.getTime() - now.getTime();

      // Refresh 5 minutes before expiry
      const refreshTime = Math.max(timeUntilExpiry - 300000, 60000);

      setTimeout(() => {
        refreshToken();
      }, refreshTime);
    };

    // Role checking function
    const hasRole = (requiredRoles: string | string[]): boolean => {
      if (!user) return false;

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      return roles.some(role =>
        user.role === role || (user.roles && user.roles.includes(role))
      );
    };

    // Initialize auth state
    useEffect(() => {
      const initializeAuth = async () => {
        if (!tokens?.accessToken) {
          setIsLoading(false);
          return;
        }

        try {
          // Verify token is still valid
          const expiresAt = new Date(tokens.expiresAt);
          const now = new Date();

          if (expiresAt <= now) {
            // Token expired, try to refresh
            await refreshToken();
            setIsLoading(false);
            return;
          }

          // Decode user from token
          const decoded = jwtDecode(tokens.accessToken) as any;
          const userData: User = {
            id: decoded.sub || decoded.userId || 'unknown',
            email: decoded.email || '',
            firstName: decoded.firstName || decoded.given_name,
            lastName: decoded.lastName || decoded.family_name,
            role: decoded.role || config.userRole,
            roles: decoded.roles || [decoded.role || config.userRole]
          };

          // Validate user role
          if (!validateRole(userData.role, userData.roles)) {
            clearAuthTokens();
            setIsLoading(false);
            return;
          }

          setUser(userData);
          scheduleRefresh(tokens);
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          clearAuthTokens();
        } finally {
          setIsLoading(false);
        }
      };

      initializeAuth();
    }, []);

    const value: AuthContextType = {
      isAuthenticated,
      user,
      isLoading,
      login,
      register: config.enableRegistration ? register : undefined,
      logout,
      refreshToken,
      hasRole
    };

    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  };
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Admin-specific configuration
export const adminAuthConfig: AuthConfig = {
  appName: 'Admin Portal',
  storageKey: 'admin-tokens',
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  userRole: 'admin',
  allowedRoles: Object.values(ADMIN_ROLES),
  roleValidator: isAdminRole,
};

// Create AdminAuthProvider
export const AdminAuthProvider = createAuthProvider(adminAuthConfig);

// ensure TS treats this file as a module
export {};

// Re-export a generic AuthProvider alias expected by app entrypoints
export { AdminAuthProvider as AuthProvider };

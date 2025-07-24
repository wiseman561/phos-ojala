import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';

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
    const authApi = config.apiClient || axios.create({
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

        const response = await authApi.post<LoginResponse>('/api/auth/login', {
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
          throw new Error('Invalid response format from server');
        }

        setAuthTokens(tokenPair);

        // Set user data or decode from token
        if (userData) {
          // Validate user role
          if (!validateRole(userData.role, userData.roles)) {
            throw new Error(`Access denied: ${config.appName} credentials required`);
          }
          setUser(userData);
        } else {
          try {
            const decoded: any = jwtDecode(tokenPair.accessToken);
            const userRole = decoded.role || decoded.roles?.[0];

            if (!validateRole(userRole, decoded.roles)) {
              throw new Error(`Access denied: ${config.appName} credentials required`);
            }

            // Create user object based on role type
            const baseUser = {
              id: decoded.sub || decoded.userId || decoded.id,
              email: decoded.email,
              firstName: decoded.firstName || decoded.given_name,
              lastName: decoded.lastName || decoded.family_name,
              role: userRole,
              roles: Array.isArray(decoded.roles) ? decoded.roles : [userRole],
            };

            // Add role-specific fields
            if (config.userRole === 'nurse') {
              setUser({
                ...baseUser,
                nurseId: decoded.nurseId,
                department: decoded.department,
                licenseNumber: decoded.licenseNumber
              } as NurseUser);
            } else if (config.userRole === 'employer') {
              setUser({
                ...baseUser,
                organizationId: decoded.organizationId || decoded.orgId,
                organizationName: decoded.organizationName || decoded.orgName,
                employerTitle: decoded.title || decoded.employerTitle,
                department: decoded.department
              } as EmployerUser);
            } else if (config.userRole === 'patient') {
              setUser({
                ...baseUser,
                patientId: decoded.patientId,
                dateOfBirth: decoded.dateOfBirth,
                phone: decoded.phone
              } as PatientUser);
            } else {
              setUser(baseUser);
            }
          } catch (err) {
            console.error('Could not decode user info from token:', err);
            throw new Error('Invalid token or insufficient permissions');
          }
        }

        return { success: true };
      } catch (error: any) {
        console.error('Login failed:', error);
        clearAuthTokens();
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Login failed. Please check your credentials.'
        };
      } finally {
        setIsLoading(false);
      }
    };

    // Register function (optional)
    const register = config.enableRegistration ? async (userData: RegisterData): Promise<{ success: boolean; message?: string }> => {
      try {
        setIsLoading(true);

        const response = await authApi.post('/api/auth/register', {
          ...userData,
          role: config.userRole
        });

        // After successful registration, attempt to login
        const loginResult = await login(userData.email, userData.password);
        return loginResult;
      } catch (error: any) {
        console.error('Registration failed:', error);
        return {
          success: false,
          message: error.response?.data?.message || error.message || 'Registration failed. Please try again.'
        };
      } finally {
        setIsLoading(false);
      }
    } : undefined;

    // Refresh token function
    const refreshToken = async (): Promise<void> => {
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      try {
        const response = await authApi.post<LoginResponse>('/api/auth/refresh', {
          refreshToken: tokens.refreshToken
        });

        const data = response.data;
        const newTokenPair: TokenPair = {
          accessToken: data.accessToken || data.token || '',
          refreshToken: data.refreshToken || tokens.refreshToken,
          expiresAt: data.expiresAt || new Date(Date.now() + 3600000).toISOString()
        };

        setAuthTokens(newTokenPair);
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
        throw error;
      }
    };

    // Logout function
    const logout = () => {
      try {
        // Attempt to notify server of logout
        if (tokens?.accessToken) {
          authApi.post('/api/auth/logout', {
            refreshToken: tokens.refreshToken
          }).catch(err => {
            console.warn('Logout notification failed:', err);
          });
        }
      } catch (error) {
        console.warn('Logout error:', error);
      } finally {
        clearAuthTokens();
      }
    };

    // Schedule token refresh
    const scheduleRefresh = (tokenPair: TokenPair) => {
      const expiresAt = new Date(tokenPair.expiresAt).getTime();
      const now = Date.now();
      const refreshTime = expiresAt - now - 300000; // Refresh 5 minutes before expiry

      if (refreshTime > 0) {
        setTimeout(() => {
          refreshToken().catch(err => {
            console.error('Scheduled token refresh failed:', err);
            logout();
          });
        }, refreshTime);
      }
    };

    // Role checking function
    const hasRole = (requiredRoles: string | string[]): boolean => {
      if (!user) return false;

      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
      const userRoles = user.roles || [user.role];

      return roles.some(role => userRoles.includes(role));
    };

    // Initialize authentication on mount
    useEffect(() => {
      const initializeAuth = async () => {
        try {
          if (tokens?.accessToken) {
            // Set axios header
            authApi.defaults.headers.common.Authorization = `Bearer ${tokens.accessToken}`;

            // Check if token is expired
            const decoded: any = jwtDecode(tokens.accessToken);
            const isExpired = decoded.exp * 1000 < Date.now();

            if (isExpired) {
              // Try to refresh token
              await refreshToken();
            } else {
              // Token is valid, extract user info
              const userRole = decoded.role || decoded.roles?.[0];

              if (!validateRole(userRole, decoded.roles)) {
                throw new Error(`Access denied: ${config.appName} credentials required`);
              }

              const baseUser = {
                id: decoded.sub || decoded.userId || decoded.id,
                email: decoded.email,
                firstName: decoded.firstName || decoded.given_name,
                lastName: decoded.lastName || decoded.family_name,
                role: userRole,
                roles: Array.isArray(decoded.roles) ? decoded.roles : [userRole],
              };

              // Add role-specific fields
              if (config.userRole === 'nurse') {
                setUser({
                  ...baseUser,
                  nurseId: decoded.nurseId,
                  department: decoded.department,
                  licenseNumber: decoded.licenseNumber
                } as NurseUser);
              } else if (config.userRole === 'employer') {
                setUser({
                  ...baseUser,
                  organizationId: decoded.organizationId || decoded.orgId,
                  organizationName: decoded.organizationName || decoded.orgName,
                  employerTitle: decoded.title || decoded.employerTitle,
                  department: decoded.department
                } as EmployerUser);
              } else if (config.userRole === 'patient') {
                setUser({
                  ...baseUser,
                  patientId: decoded.patientId,
                  dateOfBirth: decoded.dateOfBirth,
                  phone: decoded.phone
                } as PatientUser);
              } else {
                setUser(baseUser);
              }

              // Schedule next refresh
              scheduleRefresh(tokens);
            }
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
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
      register,
      logout,
      refreshToken,
      hasRole
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Predefined configurations for different apps
export const nurseAuthConfig: AuthConfig = {
  appName: 'Nurse Dashboard',
  storageKey: 'rn-dashboard-tokens',
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  userRole: 'nurse',
  allowedRoles: Object.values(NURSE_ROLES),
  roleValidator: isNurseRole,
};

export const employerAuthConfig: AuthConfig = {
  appName: 'Employer Dashboard',
  storageKey: 'employer-dashboard-tokens',
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  userRole: 'employer',
  allowedRoles: Object.values(EMPLOYER_ROLES),
  roleValidator: isEmployerRole,
};

export const patientAuthConfig: AuthConfig = {
  appName: 'Patient Portal',
  storageKey: 'patient-portal-tokens',
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5010',
  userRole: 'patient',
  allowedRoles: ['patient'],
  enableRegistration: true,
  roleValidator: isPatientRole,
};

export const adminAuthConfig: AuthConfig = {
  appName: 'Admin Portal',
  storageKey: 'admin-tokens',
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  userRole: 'admin',
  allowedRoles: Object.values(ADMIN_ROLES),
  roleValidator: isAdminRole,
};

// Create AuthProvider components for each app
export const NurseAuthProvider = createAuthProvider(nurseAuthConfig);
export const EmployerAuthProvider = createAuthProvider(employerAuthConfig);
export const PatientAuthProvider = createAuthProvider(patientAuthConfig);
export const AdminAuthProvider = createAuthProvider(adminAuthConfig);

// Export individual role constants for backward compatibility
export { NURSE_ROLES, EMPLOYER_ROLES, PATIENT_ROLES, ADMIN_ROLES };
export type { NurseRole, EmployerRole, PatientRole, AdminRole };

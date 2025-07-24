import {
  createAuthProvider,
  useAuth as useSharedAuth,
  type AuthConfig,
  type AuthContextType,
  type User
} from './auth/AuthContext';

// Create a generic config for web portal
const webAuthConfig: AuthConfig = {
  appName: 'Web Portal',
  storageKey: 'web-tokens',
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  userRole: 'user',
  allowedRoles: ['user', 'admin', 'provider'], // Allow multiple role types
};

// Create the AuthProvider with web config
export const AuthProvider = createAuthProvider(webAuthConfig);

// Export the useAuth hook
export const useAuth = useSharedAuth;

// Export types
export type { AuthContextType, User };

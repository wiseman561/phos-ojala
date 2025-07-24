import {
  createAuthProvider,
  useAuth as useSharedAuth,
  type AuthConfig,
  type AuthContextType,
  type User
} from '../../shared/contexts/AuthContext';

// Create a config for MD dashboard
const mdAuthConfig: AuthConfig = {
  appName: 'MD Dashboard',
  storageKey: 'md-dashboard-tokens',
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  userRole: 'provider',
  allowedRoles: ['provider', 'doctor', 'physician', 'md'], // Allow provider role types
};

// Create the AuthProvider with MD config
export const AuthProvider = createAuthProvider(mdAuthConfig);

// Export the useAuth hook
export const useAuth = useSharedAuth;

// Export types
export type { AuthContextType, User };

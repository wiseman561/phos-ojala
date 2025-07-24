import { apiClient } from '../services/apiClient';
import {
  createAuthProvider,
  useAuth as useSharedAuth,
  patientAuthConfig,
  type AuthContextType,
  type User,
  type PatientUser,
  type RegisterData
} from '../../shared/contexts/AuthContext';

// Create a custom config for Patient Portal that uses its API client
const customPatientConfig = {
  ...patientAuthConfig,
  apiClient: apiClient
};

// Create the AuthProvider with custom config
export const AuthProvider = createAuthProvider(customPatientConfig);

// Export the useAuth hook
export const useAuth = useSharedAuth;

// Export types
export type { AuthContextType, User, PatientUser, RegisterData };

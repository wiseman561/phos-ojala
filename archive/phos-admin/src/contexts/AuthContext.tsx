// Export shared AuthContext for Admin Portal
export {
  useAuth,
  AdminAuthProvider as AuthProvider,
  ADMIN_ROLES as ROLES,
  type AdminRole,
  type AuthContextType,
  type User
} from './auth/AuthContext';

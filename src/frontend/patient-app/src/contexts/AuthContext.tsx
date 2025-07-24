// Export shared AuthContext for Patient App (use same as Patient Portal)
export {
  useAuth,
  PatientAuthProvider as AuthProvider,
  PATIENT_ROLES,
  type PatientRole,
  type AuthContextType,
  type User,
  type PatientUser
} from '../../shared/contexts/AuthContext';

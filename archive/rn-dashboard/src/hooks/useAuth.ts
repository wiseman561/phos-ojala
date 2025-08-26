// This file re-exports the useAuth hook from AuthContext
// to maintain backward compatibility with existing imports in RN Dashboard

export { useAuth, NURSE_ROLES } from '../contexts/auth/AuthContext';
export type { NurseRole } from '../contexts/auth/AuthContext';

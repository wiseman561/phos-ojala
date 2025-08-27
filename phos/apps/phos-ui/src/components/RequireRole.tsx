import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

type RequireRoleProps = {
  roles: string[];
  children: JSX.Element;
};

export default function RequireRole({ roles, children }: RequireRoleProps) {
  const { isAuthenticated, hasAnyRole, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasAnyRole(roles)) return <Navigate to="/unauthorized" replace />;
  return children;
}



import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

type ProtectedRouteProps = {
  children: JSX.Element;
  roles?: string[];
};

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, roles: userRoles, isLoading, hasAnyRole } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !hasAnyRole(roles)) return <Navigate to="/unauthorized" replace />;

  return children;
}



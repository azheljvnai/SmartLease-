import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../common/LoadingSpinner';
import type { UserRole } from '../../../types';

type ProtectedRouteProps = {
  allowedRole?: UserRole;
};

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user || !profile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRole && profile.role !== allowedRole) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/tenant'} replace />;
  }

  return <Outlet />;
}

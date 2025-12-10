import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

// Default redirect paths for each role
const roleDefaultPaths: Record<UserRole, string> = {
  super_admin: '/admin-portal',
  landlord: '/dashboard',
  employee: '/employee-portal',
  tenant: '/tenant-portal',
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show nothing while loading auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user's role is allowed for this route
  if (!allowedRoles.includes(user.role)) {
    // Redirect to user's default portal
    const defaultPath = roleDefaultPaths[user.role];
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}

// Higher-order component for convenience
export function withRoleProtection(Component: React.ComponentType, allowedRoles: UserRole[]) {
  return function ProtectedComponent(props: any) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

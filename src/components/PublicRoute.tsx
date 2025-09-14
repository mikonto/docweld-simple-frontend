import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useApp } from '@/contexts/AppContext';
import { Spinner } from '@/components/ui/custom/spinner';

interface PublicRouteProps {
  children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { userAuth, isAuthorized, loading } = useApp();

  const isAuthenticated = !!userAuth;
  const hasAccess = isAuthenticated && isAuthorized;

  // PublicRoute should only redirect authenticated users to home page
  // It should NOT sign them out - that's PrivateRoute's responsibility

  // Always show spinner while loading to prevent flash of login
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  // Redirect authorized users to home
  if (hasAccess) {
    return <Navigate to="/" replace />;
  }

  // Only show login/public content after confirming user is not authorized
  return <>{children}</>;
}

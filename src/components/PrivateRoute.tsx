import React, { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSignOut } from 'react-firebase-hooks/auth';

import { useApp } from '@/contexts/AppContext';
import { auth } from '@/config/firebase';
import { Spinner } from '@/components/ui/custom/spinner';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { t } = useTranslation();
  const { userAuth, userDb, isAuthorized, loading, error } = useApp();
  const [signOutUser] = useSignOut(auth);
  const navigate = useNavigate();

  // Track if we're in the process of signing out to prevent re-auth
  const signingOutRef = React.useRef(false);

  const isAuthenticated = !!userAuth;

  React.useEffect(() => {
    // Handle all security scenarios after loading completes
    if (!loading && isAuthenticated && !signingOutRef.current) {
      if (error) {
        // Firestore error - can't verify user, sign out for security
        signingOutRef.current = true;

        // Store message to show after navigation
        sessionStorage.setItem('authError', t('auth.verificationError'));

        signOutUser().then(() => {
          navigate('/login');
        });
      } else if (!userDb) {
        // User doesn't exist in Firestore - sign out and redirect
        signingOutRef.current = true;

        // Store message to show after navigation
        sessionStorage.setItem('authError', t('auth.unauthorizedAccess'));

        signOutUser().then(() => {
          navigate('/login');
        });
      } else if (userDb.status !== 'active') {
        // User exists but is not active - sign out and redirect
        signingOutRef.current = true;

        // Store message to show after navigation
        sessionStorage.setItem('authError', t('auth.unauthorizedAccess'));

        signOutUser()
          .then(() => {
            navigate('/login');
          })
          .catch((_error) => {
            // Still navigate to login even if sign out fails
            navigate('/login');
          });
      }
      // If user is active, do nothing (allow access)
    }
  }, [loading, isAuthenticated, error, userDb, signOutUser, navigate, t]);

  // Show spinner while loading or during sign out
  if (loading || signingOutRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Only show content if explicitly authorized
  // Show spinner for any other state (prevents flash of content)
  if (isAuthorized) {
    return <>{children}</>;
  }

  // Default: show spinner while security checks are running
  // This prevents showing content before authorization is confirmed
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="large" />
    </div>
  );
}
import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSignInWithEmailAndPassword } from 'react-firebase-hooks/auth';
import { toast } from 'sonner';

import { auth } from '@/config/firebase';
import { useApp } from '@/contexts/AppContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/custom/spinner';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Check for stored auth error message
  useEffect(() => {
    const authError = sessionStorage.getItem('authError');
    if (authError) {
      toast.error(authError, { id: 'stored-auth-error' });
      sessionStorage.removeItem('authError');
    }
  }, []);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Authentication hooks
  const [signIn, _user, isSigningIn, signInError] =
    useSignInWithEmailAndPassword(auth);
  const { loading: checkingAuth, userAuth } = useApp();

  // Show error toast if sign-in fails
  useEffect(() => {
    if (signInError) {
      toast.error(t('auth.invalidCredentials'), { id: 'login-error' });
    }
  }, [signInError, t]);

  // Remove the complex logic - let PrivateRoute handle unauthorized users

  // Redirect to home when user is authenticated (even if not authorized)
  // PrivateRoute will handle unauthorized users
  useEffect(() => {
    if (userAuth && !checkingAuth) {
      // User is authenticated, redirect to home
      // PrivateRoute will check if they're authorized
      navigate('/');
    }
  }, [userAuth, checkingAuth, navigate]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    signIn(email, password);
  };

  // Show loading spinner during authentication
  const isLoading = isSigningIn || checkingAuth;
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="large">{t('auth.authenticating')}</Spinner>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-main-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t('auth.login')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder={t('auth.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSigningIn}>
              {t('auth.signIn')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

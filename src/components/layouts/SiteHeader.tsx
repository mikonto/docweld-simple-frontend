import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useSignOut } from 'react-firebase-hooks/auth';
import { toast } from 'sonner';
import { auth } from '@/config/firebase';

import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';

import { getSystemNavigation } from '@/config/navigation';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';

import logo from '@/assets/logo-1.png';

export function SiteHeader() {
  const { loggedInUser } = useApp();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [signOut] = useSignOut(auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Get system navigation items from config (filtered by user role)
  const systemNavItems = getSystemNavigation(t, loggedInUser?.role);

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    setIsLoggingOut(true);
    try {
      const success = await signOut();
      if (success) {
        navigate('/login');
      } else {
        toast.error(t('auth.logoutFailed'));
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Handle navigation item click
  const handleNavItemClick = (path: string): void => {
    navigate(path);
  };

  // Handle theme change
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system'): void => {
    setTheme(newTheme);
  };

  // Handle language change
  const handleLanguageChange = (language: string): void => {
    i18n.changeLanguage(language);
  };

  const userAvatar = (
    <Avatar className="h-8 w-8">
      <AvatarFallback className="text-xs">
        {loggedInUser?.displayName
          ? loggedInUser.displayName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)
          : '?'}
      </AvatarFallback>
    </Avatar>
  );

  // Get user display name from required firstName and lastName fields
  const getUserDisplayName = (): string => {
    if (!loggedInUser) return t('common.user');
    // firstName and lastName are required fields, so they should always exist
    return `${loggedInUser.firstName} ${loggedInUser.lastName}`;
  };

  return (
    <header className="flex h-14 sticky top-0 z-50 w-full items-center border-b bg-background">
      <div className="flex h-14 w-full items-center gap-4 px-4">
        {/* Sidebar trigger - visible on mobile/tablet */}
        <SidebarTrigger className="lg:hidden" />

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="DocWeld"
            className="h-5 lg:h-6 w-auto shrink-0"
          />
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* System Navigation Menu - visible when user has access to system nav items */}
        {systemNavItems.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="grid grid-cols-3 gap-[2px] h-4 w-4">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-current rounded-full" />
                  ))}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {systemNavItems.map((item) => (
                <DropdownMenuItem
                  key={item.path}
                  onClick={() => handleNavItemClick(item.path)}
                  className="gap-2"
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Menu */}
        {loggedInUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={
                  loggedInUser?.displayName ||
                  loggedInUser?.email ||
                  t('common.userMenu')
                }
              >
                {userAvatar}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                {userAvatar}
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {loggedInUser?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />

              {/* Theme Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {t('theme.theme')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleThemeChange('system')}>
                    {t('theme.system')}
                    {theme === 'system' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleThemeChange('light')}>
                    {t('theme.light')}
                    {theme === 'light' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleThemeChange('dark')}>
                    {t('theme.dark')}
                    {theme === 'dark' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Language Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {t('language.language')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleLanguageChange('en')}>
                    {t('language.english')}
                    {i18n.language === 'en' && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange('da')}>
                    {t('language.danish')}
                    {i18n.language === 'da' && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Logout */}
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-destructive"
              >
                {isLoggingOut ? t('auth.loggingOut') : t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

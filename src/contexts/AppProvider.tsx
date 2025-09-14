import type { ReactNode } from 'react';
import { AppContext } from './AppContext';
import { useAuthWithFirestore } from '@/hooks/useAuthWithFirestore';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Use our custom hook that handles all the complexity
  const authData = useAuthWithFirestore();

  // Simply pass through the auth data to the context
  return <AppContext.Provider value={authData}>{children}</AppContext.Provider>;
}

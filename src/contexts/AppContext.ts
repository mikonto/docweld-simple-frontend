import { createContext, useContext } from 'react';
import type { UseAuthWithFirestoreReturn } from '@/hooks/useAuthWithFirestore';

// Create the app context with initial state
export const AppContext = createContext<UseAuthWithFirestoreReturn>({
  loggedInUser: null,
  userAuth: null,
  userDb: null,
  userStatus: null,
  isAuthorized: false,
  loading: false,
  error: undefined,
});

// Custom hook to use the app context
export function useApp(): UseAuthWithFirestoreReturn {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
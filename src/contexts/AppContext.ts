import { createContext, useContext } from 'react';
import type { UseAuthWithFirestoreReturn } from '@/hooks/useAuthWithFirestore';

// Create the app context with initial state
export const AppContext = createContext<UseAuthWithFirestoreReturn | undefined>(
  undefined
);

// Custom hook to use the app context
export function useApp(): UseAuthWithFirestoreReturn {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

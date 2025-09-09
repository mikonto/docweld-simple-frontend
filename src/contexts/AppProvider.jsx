import { AppContext } from './AppContext';
import { useAuthWithFirestore } from '@/hooks/useAuthWithFirestore';

export function AppProvider({ children }) {
  // Use our custom hook that handles all the complexity
  const authData = useAuthWithFirestore();

  // Simply pass through the auth data to the context
  return <AppContext.Provider value={authData}>{children}</AppContext.Provider>;
}

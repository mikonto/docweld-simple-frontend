import { createContext, useContext } from 'react';

// Create the app context with initial state
export const AppContext = createContext({
  loggedInUser: null,
  userAuth: null,
  userDb: null,
  userStatus: null,
  isAuthorized: false,
  loading: false,
  error: null,
});

// Custom hook to use the app context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

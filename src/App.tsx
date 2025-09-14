import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';

import './i18n/config';
import router from './routes';
import { AppProvider } from './contexts/AppProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import { ErrorBoundary, ErrorFallback } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider>
        <AppProvider>
          <RouterProvider router={router} />
          <Toaster richColors position="bottom-right" expand={true} />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

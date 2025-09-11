import { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/custom/spinner";

interface ErrorLoadingWrapperProps {
  error: Error | null;
  loading: boolean;
  resourceName?: string;
  children: ReactNode;
}

/**
 * Wrapper component that handles error and loading states
 * Shows appropriate UI while loading or when errors occur
 */
export function ErrorLoadingWrapper({ 
  error, 
  loading, 
  resourceName = "data", 
  children 
}: ErrorLoadingWrapperProps) {
  // Show error state
  if (error) {
    return (
      <Card>
        <CardContent className="text-red-700">
          Error loading {resourceName}: {error.message}
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  // Show children when loaded successfully
  return <>{children}</>;
}
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FallbackProps } from 'react-error-boundary';

import { AlertTriangle, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Default error fallback component for react-error-boundary
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-main-background">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 text-red-500">
            <AlertTriangle className="h-full w-full" />
          </div>
          <CardTitle className="text-2xl">
            {t('errors.somethingWentWrong')}
          </CardTitle>
          <CardDescription>
            {t('errors.unexpectedErrorApology')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show error details in development */}
          {import.meta.env.DEV && (
            <div className="rounded-lg bg-gray-100 p-4 text-sm">
              <p className="font-semibold text-gray-700 mb-2">
                {t('errors.errorLabel')}: {error.toString()}
              </p>
              <details className="text-gray-600">
                <summary className="cursor-pointer font-medium">
                  {t('errors.stackTrace')}
                </summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs overflow-x-auto">
                  {error.stack}
                </pre>
              </details>
            </div>
          )}

          {/* Action button */}
          <div className="flex justify-center">
            <Button
              onClick={resetErrorBoundary}
              variant="default"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t('common.tryAgain')}
            </Button>
          </div>

          {/* Additional help text */}
          <p className="text-center text-sm text-gray-500">
            {t('errors.contactSupportIfPersists')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default ErrorFallback;
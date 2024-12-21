import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import * as Sentry from '@sentry/react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const ErrorFallback: Sentry.FallbackRender = (props) => {
  const { error, resetError } = props;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-4 text-center">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-gray-600 dark:text-gray-400">
        {error instanceof Error ? error.message : 'An unexpected error occurred'}
      </p>
      <Button onClick={resetError} variant="outline">
        Try again
      </Button>
    </div>
  );
};

export const ErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: Props) => children,
  {
    fallback: ErrorFallback
  }
);
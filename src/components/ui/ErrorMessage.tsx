import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { trackErrorWithContext, ErrorSeverity } from '../../services/errorTracking';

interface ErrorMessageProps {
  message: string;
  context?: string;
  componentName?: string;
}

export function ErrorMessage({ message, context = 'ui', componentName }: ErrorMessageProps) {
  useEffect(() => {
    trackErrorWithContext(
      new Error(message),
      {
        category: 'UI',
        severity: ErrorSeverity.MEDIUM,
        componentName: componentName || 'ErrorMessage',
        action: 'display_error',
        metadata: {
          context,
          displayTimestamp: new Date().toISOString()
        }
      }
    );
  }, [message, context, componentName]);

  return (
    <div className="mt-4 p-4 bg-accent-alt/10 text-accent-alt rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
}
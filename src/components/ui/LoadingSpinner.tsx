import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  message,
  className = '',
  ...props 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`} {...props}>
      <Loader2 className={`animate-spin text-accent dark:text-accent-dark ${sizeClasses[size]}`} />
      {message && (
        <p className="text-sm text-tertiary dark:text-dark-tertiary">
          {message}
        </p>
      )}
    </div>
  );
}

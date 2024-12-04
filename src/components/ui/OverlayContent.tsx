import React from 'react';
import { cn } from '../../utils/cn';

interface OverlayContentProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function OverlayContent({ 
  title, 
  description, 
  children, 
  className 
}: OverlayContentProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}
import React from 'react';
import { cn } from '../../utils/cn';

interface OverlayFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function OverlayFooter({ children, className }: OverlayFooterProps) {
  return (
    <div 
      className={cn(
        "mt-6 flex justify-end gap-3",
        "border-t border-gray-200 pt-4 dark:border-gray-700",
        className
      )}
    >
      {children}
    </div>
  );
}
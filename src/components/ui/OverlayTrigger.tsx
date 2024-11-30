import React from 'react';
import { cn } from '../../utils/cn';

interface OverlayTriggerProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function OverlayTrigger({ onClick, children, className }: OverlayTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        "focus:ring-accent dark:focus:ring-accent-alt",
        className
      )}
    >
      {children}
    </button>
  );
}
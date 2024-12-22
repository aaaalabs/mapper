/**
 * Button Component
 * 
 * Color Guidelines [Rule 907]:
 * 1. Text color must maintain contrast ratio ≥4.5:1 with background in all states
 * 2. Hover states must explicitly set text color to maintain contrast
 * 3. Dark mode colors must be tested separately for contrast
 * 4. Use CSS custom properties for consistent color relationships:
 *    - Primary button: bg-primary → text-background
 *    - Ghost/Outline: text-primary → hover:text-primary
 *    - Destructive: bg-destructive → text-destructive-foreground
 */

import React from 'react';
import { cn } from '../../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-lg';
  
  const variants = {
    primary: [
      'bg-primary text-background hover:bg-secondary hover:text-background',
      'dark:bg-dark-primary dark:text-dark-background dark:hover:bg-dark-secondary/80 dark:hover:text-dark-background',
      'border border-transparent'
    ].join(' '),
    ghost: [
      'bg-transparent text-primary hover:bg-background-alt hover:text-primary',
      'dark:text-dark-primary dark:hover:bg-dark-background/20 dark:hover:text-dark-primary',
      'border border-transparent'
    ].join(' '),
    outline: [
      'bg-background text-primary border-primary hover:bg-background-alt hover:text-primary',
      'dark:bg-dark-background dark:text-dark-primary dark:border-dark-primary dark:hover:bg-dark-primary/20 dark:hover:text-dark-primary',
      'border'
    ].join(' '),
    destructive: [
      'bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground',
      'dark:bg-dark-destructive dark:text-dark-destructive-foreground dark:hover:bg-dark-destructive/80 dark:hover:text-dark-destructive-foreground',
      'border border-transparent'
    ].join(' ')
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3'
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner className="mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
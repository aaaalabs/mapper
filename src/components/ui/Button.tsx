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
      'bg-primary text-background hover:bg-secondary',
      'dark:bg-background dark:text-primary dark:hover:bg-background-alt',
      'border border-transparent'
    ].join(' '),
    ghost: [
      'bg-transparent text-primary hover:bg-background-alt',
      'dark:text-background dark:hover:bg-background-alt',
      'border border-transparent'
    ].join(' '),
    outline: [
      'bg-transparent text-primary hover:bg-background-alt',
      'dark:text-background dark:hover:bg-background-alt',
      'border border-primary dark:border-background'
    ].join(' '),
    destructive: [
      'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      'dark:bg-destructive dark:text-destructive-foreground dark:hover:bg-destructive/90',
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
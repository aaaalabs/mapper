import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        {
          'bg-gradient-to-r from-accent to-accent-alt text-background-white hover:from-accent/90 hover:to-accent-alt/90': variant === 'primary',
          'bg-background-white text-primary hover:bg-background': variant === 'secondary',
          'border border-tertiary/30 bg-transparent hover:bg-background text-primary': variant === 'outline',
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
          'p-2 w-10 h-10': size === 'icon',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
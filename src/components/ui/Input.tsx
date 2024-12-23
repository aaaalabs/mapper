import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={cn(
        'block w-full rounded-md border px-3 py-2 shadow-sm',
        'bg-white dark:bg-gray-800',
        'text-gray-900 dark:text-gray-100',
        'border-gray-300 dark:border-gray-700',
        'placeholder-gray-400 dark:placeholder-gray-500',
        'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
        'disabled:cursor-not-allowed disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:text-gray-500',
        className
      )}
      {...props}
    />
  );
}

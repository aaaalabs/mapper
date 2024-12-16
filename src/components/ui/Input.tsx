import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = '', ...props }: InputProps) {
  return (
    <input
      className={`block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm 
        focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary 
        disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 
        ${className}`}
      {...props}
    />
  );
}

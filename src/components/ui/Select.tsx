import * as React from 'react';
import { cn } from '@/lib/utils';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  className?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function Select({
  className,
  options,
  value,
  onChange,
  disabled,
}: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select
      className={cn(
        'h-9 w-full rounded-md border px-3 py-1 shadow-sm',
        'bg-white dark:bg-gray-800',
        'text-gray-900 dark:text-gray-100',
        'border-gray-300 dark:border-gray-700',
        'focus:outline-none focus:ring-1 focus:ring-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&>option]:bg-white dark:[&>option]:bg-gray-800',
        className
      )}
      value={value}
      onChange={handleChange}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

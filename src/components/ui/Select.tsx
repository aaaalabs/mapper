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
        'h-9 w-full rounded-md border border-input bg-background px-3 py-1',
        'text-sm shadow-sm transition-colors',
        'focus:outline-none focus:ring-1 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
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

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="mt-4 p-4 bg-accent-alt/10 text-accent-alt rounded-lg flex items-center gap-2">
      <AlertCircle className="w-5 h-5" />
      <span>{message}</span>
    </div>
  );
}
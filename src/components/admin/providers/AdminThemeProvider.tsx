import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';

interface AdminThemeProviderProps {
  children: React.ReactNode;
}

export function AdminThemeProvider({ children }: AdminThemeProviderProps) {
  return (
    <ThemeProvider
      defaultTheme="system"
      storageKey="mapper-admin-theme"
      customTheme={{
        light: {
          background: 'bg-white',
          'background-alt': 'bg-gray-50',
          foreground: 'text-gray-900',
          'muted-foreground': 'text-gray-500',
          border: 'border-gray-200',
          primary: 'text-blue-600',
          'primary-foreground': 'text-white',
          muted: 'bg-gray-100',
        },
        dark: {
          background: 'bg-gray-900',
          'background-alt': 'bg-gray-800',
          foreground: 'text-gray-50',
          'muted-foreground': 'text-gray-400',
          border: 'border-gray-700',
          primary: 'text-blue-400',
          'primary-foreground': 'text-gray-900',
          muted: 'bg-gray-800/50',
        },
      }}
    >
      {children}
    </ThemeProvider>
  );
}

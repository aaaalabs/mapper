import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  customTheme?: {
    light: {
      background: string;
      'background-alt': string;
      foreground: string;
      'muted-foreground': string;
      border: string;
      primary: string;
      'primary-foreground': string;
      muted: string;
    };
    dark: {
      background: string;
      'background-alt': string;
      foreground: string;
      'muted-foreground': string;
      border: string;
      primary: string;
      'primary-foreground': string;
      muted: string;
    };
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'theme',
  customTheme
}: ThemeProviderProps) {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      return stored === 'dark';
    }
    // Then check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme immediately on mount
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    localStorage.setItem(storageKey, !isDark ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

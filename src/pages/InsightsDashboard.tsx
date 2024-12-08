import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Loader2 } from 'lucide-react';
import { DashboardContent } from '../components/insights/DashboardContent';

// Get password from environment variable
const CORRECT_PASSWORD = import.meta.env.VITE_DASHBOARD_PASSWORD;

if (!CORRECT_PASSWORD) {
  throw new Error('Missing VITE_DASHBOARD_PASSWORD environment variable');
}

// Rate limiting constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

interface DashboardState {
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
  remainingAttempts: number;
  lockedUntil: number | null;
}

export function InsightsDashboard() {
  const [state, setState] = useState<DashboardState>({
    isLoading: false,
    isAuthenticated: false,
    isAuthenticating: false,
    error: null,
    remainingAttempts: MAX_ATTEMPTS,
    lockedUntil: null
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if locked out
    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      const minutesLeft = Math.ceil((state.lockedUntil - Date.now()) / (60 * 1000));
      setState(prev => ({ 
        ...prev, 
        error: `Too many attempts. Please try again in ${minutesLeft} minutes.`
      }));
      return;
    }

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;

    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      if (password === CORRECT_PASSWORD) {
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: true,
          isAuthenticating: false,
          remainingAttempts: MAX_ATTEMPTS,
          lockedUntil: null
        }));
        sessionStorage.setItem('dashboard_auth', '1');
      } else {
        const remainingAttempts = state.remainingAttempts - 1;
        if (remainingAttempts === 0) {
          setState(prev => ({ 
            ...prev, 
            error: 'Too many failed attempts. Please try again in 15 minutes.',
            isAuthenticating: false,
            remainingAttempts: MAX_ATTEMPTS,
            lockedUntil: Date.now() + LOCKOUT_TIME
          }));
        } else {
          setState(prev => ({ 
            ...prev, 
            error: `Invalid password. ${remainingAttempts} attempts remaining.`,
            isAuthenticating: false,
            remainingAttempts
          }));
        }
        throw new Error('Invalid password');
      }
    } catch (error) {
      // Error state is already set above
    }
  };

  const handleSignOut = () => {
    setState(prev => ({ 
      ...prev, 
      isAuthenticated: false,
      remainingAttempts: MAX_ATTEMPTS,
      lockedUntil: null 
    }));
    sessionStorage.removeItem('dashboard_auth');
  };

  // Check session storage on mount
  useEffect(() => {
    const isAuthed = sessionStorage.getItem('dashboard_auth') === '1';
    setState(prev => ({ 
      ...prev, 
      isAuthenticated: isAuthed,
      remainingAttempts: isAuthed ? MAX_ATTEMPTS : prev.remainingAttempts
    }));
  }, []);

  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-alt">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Analytics Dashboard</h1>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                autoFocus
                disabled={state.lockedUntil !== null && Date.now() < state.lockedUntil}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            {state.error && (
              <div className="text-red-500 text-sm text-center">
                {state.error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={state.isAuthenticating || (state.lockedUntil !== null && Date.now() < state.lockedUntil)}
            >
              {state.isAuthenticating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Sign In
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-alt">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <Button 
            variant="secondary"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </header>

        <DashboardContent />
      </div>
    </div>
  );
} 
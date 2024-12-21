import React, { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

const ADMIN_EMAIL = 'admin@libralab.ai';

export function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });

      if (error) throw error;

      if (data?.user?.email === ADMIN_EMAIL) {
        sessionStorage.setItem('is_admin', 'true');
        navigate('/admin');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid password');
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div>
          <h2 className="text-2xl font-semibold text-primary dark:text-background text-center">
            Login
          </h2>
          <p className="mt-2 text-sm text-secondary dark:text-background-alt text-center">
            Enter your password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full"
              required
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>
          <Button 
            type="submit" 
            className="w-full"
            variant="primary"
            isLoading={loading}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}

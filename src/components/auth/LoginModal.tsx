import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_EMAIL = 'admin@libralab.ai';

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data?.user?.email === ADMIN_EMAIL) {
        sessionStorage.setItem('is_admin', 'true');
        navigate('/insights');
        onClose();
      } else {
        // Non-admin users are not allowed
        setError('Invalid credentials');
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = () => {
    onClose();
    // Navigate to beta waitlist section
    const element = document.getElementById('beta-features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Add some offset for the header
      window.scrollBy(0, -80);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Beta Access Login</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Enter your credentials to access beta features
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
              isLoading={loading}
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleRequestAccess}
              className="w-full"
            >
              Request Access
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
}
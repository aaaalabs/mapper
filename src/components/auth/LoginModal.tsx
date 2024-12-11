import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Z_INDEX } from '../../constants/zIndex';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: Z_INDEX.AUTH_MODAL_BACKDROP }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative flex min-h-full items-center justify-center p-4" style={{ zIndex: Z_INDEX.AUTH_MODAL_CONTENT }}>
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 text-left shadow-xl transition-all">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal Content */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900">Beta Access Login</h3>
              <p className="mt-2 text-sm text-gray-500">
                Enter your credentials to access beta features
              </p>
            </div>

            <form className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a href="#" className="font-medium text-accent hover:text-accent-alt">
                    Forgot password?
                  </a>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-accent hover:text-accent-alt">
                    Request access
                  </a>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  // Handle login logic here
                }}
              >
                Sign in
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
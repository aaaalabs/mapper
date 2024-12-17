import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { AdminMenu } from '../auth/AdminMenu';
import { LogIn, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { scrollToElement } from '../../utils/scrollUtils';

interface NavigationProps {
  onLoginClick: () => void;
  onBetaWaitlistClick?: () => void;
}

export function Navigation({ onLoginClick, onBetaWaitlistClick }: NavigationProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const isAdminSession = sessionStorage.getItem('is_admin') === 'true';
        setIsAdmin(user?.email === 'admin@libralab.ai' && isAdminSession);
      } catch (err) {
        console.error('Auth error:', err);
        setIsAdmin(false);
      }
    };

    checkAdmin();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
      } else if (event === 'SIGNED_IN') {
        const isAdminSession = sessionStorage.getItem('is_admin') === 'true';
        setIsAdmin(session?.user?.email === 'admin@libralab.ai' && isAdminSession);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAdminAccess = () => {
    navigate('/admin/login');
  };

  const handleBetaClick = () => {
    if (onBetaWaitlistClick) {
      onBetaWaitlistClick();
    } else {
      scrollToElement('beta-features', 80);
    }
  };

  return (
    <nav className="flex items-center justify-between p-6">
      <Link to="/" className="flex items-center gap-2 hover:opacity-80">
        <Logo className="h-8 w-8 text-primary" />
        <span className="font-semibold text-primary">
          mapper.voiceloop.io
        </span>
      </Link>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {isAdmin ? (
          <AdminMenu />
        ) : (
          <button
            onClick={handleAdminAccess}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Admin Access"
          >
            {/* <Settings size={20} /> */}
          </button>
        )}
        <button 
          onClick={onLoginClick}
          className="hover:text-primary flex items-center gap-2 text-secondary"
          aria-label="Beta Login"
        >
          <LogIn className="h-5 w-5" />
          <span className="hidden sm:inline">Beta Login</span>
        </button>
        <Button 
          variant="primary" 
          onClick={handleBetaClick}
          className="flex items-center gap-2"
          aria-label="Join Beta Waitlist"
        >
          <Users className="h-5 w-5" />
          <span className="hidden sm:inline">Join Beta Waitlist</span>
        </Button>
      </div>
    </nav>
  );
}
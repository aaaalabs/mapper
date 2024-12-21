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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('is_admin');
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
          <Button
            variant="ghost"
            onClick={onLoginClick}
            className="flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Login</span>
          </Button>
        )}
        <Button 
          variant="primary" 
          onClick={handleBetaClick}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Join Beta</span>
        </Button>
      </div>
    </nav>
  );
}
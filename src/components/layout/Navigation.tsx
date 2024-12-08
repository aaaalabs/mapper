import React from 'react';
import { LogIn, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { ThemeToggle } from '../ui/ThemeToggle';
import { scrollToElement } from '../../utils/scrollUtils';

interface NavigationProps {
  onLoginClick: () => void;
}

export function Navigation({ onLoginClick }: NavigationProps) {
  const handleBetaClick = () => {
    scrollToElement('beta-features', 80);
  };

  return (
    <nav className="flex items-center justify-between p-6">
      <div className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary" />
        <span className="font-semibold text-primary">
          mapper.voiceloop.io
        </span>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
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
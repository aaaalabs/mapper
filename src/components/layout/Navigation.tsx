import React from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { scrollToElement } from '../../utils/scrollUtils';

interface NavigationProps {
  onLoginClick: () => void;
}

export function Navigation({ onLoginClick }: NavigationProps) {
  const handleBetaClick = () => {
    scrollToElement('beta-features', 80); // 80px offset for navigation bar
  };

  return (
    <nav className="flex items-center justify-between p-6">
      <div className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-primary dark:text-white" />
        <span className="font-semibold text-primary dark:text-white">
          mapper.voiceloop.io
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button 
          onClick={onLoginClick}
          className="hover:text-primary dark:hover:text-white flex items-center gap-2 text-secondary dark:text-gray-300"
        >
          <LogIn className="h-5 w-5" />
          Beta Login
        </button>
        <Button variant="primary" onClick={handleBetaClick}>
          Join Beta Waitlist
        </Button>
      </div>
    </nav>
  );
}
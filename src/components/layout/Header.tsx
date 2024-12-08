import React, { useState } from 'react';
import { Map as MapIcon, Menu, X } from 'lucide-react';
import { Logo } from '../Logo';
import { Button } from '../ui/Button';
import { DemoCallButton } from '../DemoCallButton';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <MapIcon className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                mapper.voiceloop.io
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <DemoCallButton />
            <Button variant="primary" size="sm" onClick={() => window.location.href = '#quick-upload'}>Get Started</Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={`lg:hidden transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="px-4 py-3 space-y-3 border-t border-gray-100 bg-white/95 backdrop-blur-sm">
          <a 
            href="#features" 
            className="block py-2.5 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Features
          </a>
          <a 
            href="#pricing" 
            className="block py-2.5 px-3 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Pricing
          </a>
          <div className="px-3">
            <DemoCallButton />
          </div>
          <div className="px-3 pt-2">
            <Button 
              variant="primary" 
              size="sm" 
              className="w-full justify-center"
              onClick={() => {
                window.location.href = '#quick-upload';
                setIsMenuOpen(false);
              }}
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
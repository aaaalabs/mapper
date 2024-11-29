import React, { useState } from 'react';
import { Map as MapIcon, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

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

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <Button variant="primary" size="sm">Get Started</Button>
          </nav>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100">
          <div className="px-4 py-2 space-y-1">
            <a href="#features" className="block py-2 text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="block py-2 text-gray-600 hover:text-gray-900">Pricing</a>
            <Button variant="primary" size="sm" className="w-full mt-4">Get Started</Button>
          </div>
        </div>
      )}
    </header>
  );
}
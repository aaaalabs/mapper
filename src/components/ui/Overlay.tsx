import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Overlay({ isOpen, onClose, children, className }: OverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Content Container */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div 
          className={cn(
            "relative w-full max-w-lg transform rounded-lg bg-white p-6 text-left shadow-xl transition-all duration-300",
            "dark:bg-gray-800 dark:text-white",
            className
          )}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>

          {children}
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Z_INDEX } from '../../constants/zIndex';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, children }: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: Z_INDEX.AUTH_MODAL_BACKDROP }}>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Dialog Container */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4" 
        style={{ zIndex: Z_INDEX.AUTH_MODAL_CONTENT }}
      >
        {children}
      </div>
    </div>
  );
}

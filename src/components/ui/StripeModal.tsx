import React, { useState } from 'react';
import { X, CreditCard, Lock } from 'lucide-react';
import { Button } from './Button';

interface StripeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StripeModal({ isOpen, onClose }: StripeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      // Show success message or redirect
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-primary">Start Your Free Trial</h3>
          <p className="text-secondary mt-2">7 days free, then $49/month</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Card Number
            </label>
            <input
              type="text"
              placeholder="4242 4242 4242 4242"
              className="w-full px-4 py-2 border border-tertiary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full px-4 py-2 border border-tertiary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                CVC
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-4 py-2 border border-tertiary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-secondary">
            <Lock className="w-4 h-4" />
            <span>Your payment info is secure and encrypted</span>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Start Free Trial'}
          </Button>

          <p className="text-xs text-center text-secondary">
            By starting your free trial, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
}
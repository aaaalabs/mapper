import React, { useState } from 'react';
import { X, CreditCard, Lock, Check } from 'lucide-react';
import { Button } from './Button';

interface StripeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StripeModal({ isOpen, onClose }: StripeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSuccess(true);
      
      // Close modal after showing success message
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setIsProcessing(false);
        // Reset form
        setCardNumber('');
        setExpiry('');
        setCvc('');
      }, 2000);
    } catch (error) {
      setIsProcessing(false);
      // Handle error
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
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

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">Payment Successful!</h3>
            <p className="text-secondary">Your trial has been activated.</p>
          </div>
        ) : (
          <>
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
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
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
                    value={expiry}
                    onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                    maxLength={5}
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
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
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
          </>
        )}
      </div>
    </div>
  );
}
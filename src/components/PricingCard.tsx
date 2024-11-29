import React from 'react';
import { Check } from 'lucide-react';
import { Button } from './ui/Button';
import { clsx } from 'clsx';

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  isPro?: boolean;
  onSelect: () => void;
}

export function PricingCard({ title, price, features, isPro, onSelect }: PricingCardProps) {
  return (
    <div 
      className={clsx(
        'rounded-xl p-8',
        isPro ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-white'
      )}
    >
      <div className="mb-4">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className={isPro ? 'text-blue-100' : 'text-gray-600'}>
          {price === 'Free' ? 'Perfect for trying out the service' : 'For active communities'}
        </p>
        <div className="text-3xl font-bold mt-4">
          {price}
          {price !== 'Free' && <span className="text-sm font-normal">/month</span>}
        </div>
      </div>
      
      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2">
            <Check className={clsx('w-5 h-5', isPro ? 'text-blue-200' : 'text-blue-600')} />
            <span className={isPro ? 'text-blue-50' : 'text-gray-600'}>{feature}</span>
          </li>
        ))}
      </ul>
      
      <Button
        variant={isPro ? 'secondary' : 'primary'}
        className="w-full"
        onClick={onSelect}
      >
        {isPro ? 'Start Free Trial' : 'Generate Free Map'}
      </Button>
    </div>
  );
}
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

interface PricingTier {
  name: string;
  price: number;
  features: string[];
  maxMembers: number;
  recommended?: boolean;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Basic',
    price: 0,
    maxMembers: 50,
    features: [
      'Basic community map',
      'CSV upload',
      'Share maps via link',
      'Save maps online',
      'Up to 50 members'
    ]
  },
  {
    name: 'Pro',
    price: 9.90,
    maxMembers: 500,
    recommended: true,
    features: [
      'Everything in Basic',
      'Up to 500 members',
      'Custom map styling',
      'Priority support'
    ]
  }
];

export function PricingCalculator() {
  const [selectedTier, setSelectedTier] = useState<string>('Basic');

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {pricingTiers.map((tier) => (
        <div
          key={tier.name}
          className={cn(
            "relative rounded-lg border p-6",
            tier.recommended
              ? "border-accent shadow-lg"
              : "border-gray-200",
            "hover:border-accent/50 transition-colors duration-200"
          )}
        >
          {tier.recommended && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-accent text-white text-xs px-3 py-1 rounded-full">
                Recommended
              </span>
            </div>
          )}

          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {tier.name}
            </h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              €{tier.price}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            <p className="text-sm text-gray-500">
              Up to {tier.maxMembers} community members
            </p>
          </div>

          <ul className="space-y-3 mb-6">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-accent shrink-0" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={() => setSelectedTier(tier.name)}
            className={cn(
              "w-full py-2 px-4 rounded-md text-sm font-medium transition-colors",
              selectedTier === tier.name
                ? "bg-accent text-white"
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            )}
          >
            {selectedTier === tier.name ? 'Selected' : 'Select Plan'}
          </button>
        </div>
      ))}
    </div>
  );
}
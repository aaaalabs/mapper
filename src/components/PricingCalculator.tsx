import React, { useState, useEffect } from 'react';
import { CreditCard, Users, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

interface PricingTier {
  name: string;
  range: [number, number];
  price: number;
  pricePerMember: number;
  features: string[];
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Freemium',
    range: [1, 50],
    price: 0,
    pricePerMember: 0,
    features: [
      'Interactive community map',
      'Basic member profiles',
      'Location clustering',
      'CSV data import',
      'Up to 50 members'
    ]
  },
  {
    name: 'Premium',
    range: [51, 500],
    price: 9.90,
    pricePerMember: 0,
    features: [
      'All Freemium features',
      'Unlimited members',
      'Member photos',
      'Advanced clustering',
      'Search functionality',
      'Custom branding',
      'Priority support',
      'API access',
      'Multiple maps',
      'Advanced analytics'
    ]
  }
];

interface PricingCalculatorProps {
  onPlanChange: (plan: 'free' | 'paid') => void;
}

export function PricingCalculator({ onPlanChange }: PricingCalculatorProps) {
  const [memberCount, setMemberCount] = useState(50);
  const [activeTier, setActiveTier] = useState<PricingTier>(pricingTiers[0]);

  useEffect(() => {
    const newTier = pricingTiers.find(
      tier => memberCount >= tier.range[0] && memberCount <= tier.range[1]
    ) || pricingTiers[pricingTiers.length - 1];
    setActiveTier(newTier);
    onPlanChange(newTier.name === 'Freemium' ? 'free' : 'paid');
  }, [memberCount, onPlanChange]);

  const calculateProgress = () => {
    const [min, max] = activeTier.range;
    const range = max - min;
    const progress = ((memberCount - min) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const calculateTierPrice = (tier: PricingTier) => {
    if (tier.name === 'Freemium') {
      return tier.price;
    } else if (tier.name === 'Premium') {
      if (memberCount <= 100) return 9.90;
      if (memberCount <= 250) return 14.90;
      return 19.90;
    }
    return 0;
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setMemberCount(value);
  };

  return (
    <div className="bg-background-white rounded-lg shadow-soft p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-primary mb-2">
            Calculate Your Plan
          </h3>
          <p className="text-secondary">
            Choose the perfect plan for your community size
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="member-count" className="text-primary font-medium">
              Community Members
            </label>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-xl font-bold text-primary">
                {memberCount}
              </span>
            </div>
          </div>

          <div className="relative pt-2">
            <div className="range-track">
              <div 
                className="range-progress"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
            <input
              id="member-count"
              type="range"
              min="1"
              max="500"
              value={memberCount}
              onChange={handleSliderChange}
              className="range-slider"
              aria-label="Select number of community members"
            />
          </div>

          <div className="flex justify-between text-sm text-secondary mt-3">
            <span>1</span>
            <span>50</span>
            <span>500+</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "rounded-lg p-6 transition-all duration-300",
                tier === activeTier
                  ? "bg-accent/10 border-2 border-accent"
                  : "bg-background border-2 border-transparent"
              )}
            >
              <h4 className="text-lg font-semibold text-primary mb-2">
                {tier.name}
              </h4>
              <div className="text-2xl font-bold text-primary mb-4">
                ${calculateTierPrice(tier).toFixed(2)}
                <span className="text-sm font-normal text-secondary">/month</span>
              </div>
              <ul className="space-y-2">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent" />
                    <span className="text-secondary text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
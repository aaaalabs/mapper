import React, { useState, useEffect } from 'react';
import { CreditCard, Users, Check, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../utils/cn';

interface PricingTier {
  name: string;
  range: [number, number];
  price: number;
  features: string[];
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Basic',
    range: [1, 50],
    price: 9.90,
    features: [
      'Interactive community map',
      'Basic member profiles',
      'Location clustering',
      'CSV data import',
      'HTML export'
    ]
  },
  {
    name: 'Professional',
    range: [51, 250],
    price: 14.90,
    features: [
      'All Basic features',
      'Member photos',
      'Advanced clustering',
      'Search functionality',
      'Custom branding',
      'Priority support'
    ]
  },
  {
    name: 'Enterprise',
    range: [251, 500],
    price: 19.90,
    features: [
      'All Professional features',
      'API access',
      'Multiple maps',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated support'
    ]
  }
];

export function PricingCalculator() {
  const [memberCount, setMemberCount] = useState(50);
  const [activeTier, setActiveTier] = useState<PricingTier>(pricingTiers[0]);
  const [showTooltip, setShowTooltip] = useState('');

  useEffect(() => {
    const newTier = pricingTiers.find(
      tier => memberCount >= tier.range[0] && memberCount <= tier.range[1]
    ) || pricingTiers[pricingTiers.length - 1];
    setActiveTier(newTier);
  }, [memberCount]);

  const calculateProgress = () => {
    const [min, max] = activeTier.range;
    const range = max - min;
    const progress = ((memberCount - min) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
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
            <label className="text-primary font-medium">
              Community Members
            </label>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              <span className="text-xl font-bold text-primary">
                {memberCount}
              </span>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="500"
            value={memberCount}
            onChange={(e) => setMemberCount(parseInt(e.target.value))}
            className="w-full h-2 bg-background rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--color-accent) ${calculateProgress()}%, var(--color-background) ${calculateProgress()}%)`
            }}
          />

          <div className="flex justify-between text-sm text-secondary mt-1">
            <span>1</span>
            <span>250</span>
            <span>500+</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                ${tier.price}
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

        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={() => {}}
            className="group"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {}}
          >
            Contact Sales
          </Button>
        </div>

        <p className="text-center text-sm text-secondary mt-4">
          7-day free trial, no credit card required
        </p>
      </div>
    </div>
  );
}
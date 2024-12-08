import React from 'react';
import { PricingCalculator } from '../PricingCalculator';

export function PricingSection() {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Start for free and upgrade as your community grows. No hidden fees, no surprises.
        </p>
      </div>
      <PricingCalculator />
    </section>
  );
} 
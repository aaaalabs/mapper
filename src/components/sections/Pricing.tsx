import React, { useState } from 'react';
import { PricingCalculator } from '../PricingCalculator';
import { PricingSlider } from '../ui/PricingSlider';
import { StripeModal } from '../ui/StripeModal';
import { generateStandaloneHtml, downloadHtmlFile } from '../../utils/exportMap';

interface PricingProps {
  onDownload?: () => void;
  hasMap?: boolean;
  mapData?: {
    members: any[];
    center: [number, number];
    options: any;
  };
}

export function Pricing({ onDownload, hasMap = false, mapData }: PricingProps) {
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'paid'>('free');

  const handlePlanChange = (plan: 'free' | 'paid') => {
    setSelectedPlan(plan);
    if (plan === 'paid') {
      setShowStripeModal(true);
    }
  };

  const handleDownload = () => {
    if (mapData) {
      const html = generateStandaloneHtml(
        mapData.members,
        mapData.center,
        mapData.options
      );
      downloadHtmlFile(html, 'community-map.html');
    }
  };

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
        
        <div className="max-w-xl mx-auto mb-16">
          <PricingSlider 
            onPlanChange={handlePlanChange}
            className="mb-12"
          />
        </div>

        <PricingCalculator />
      </div>

      <StripeModal 
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
      />
    </section>
  );
}
import { useState } from 'react';
import { PricingCalculator } from '../PricingCalculator';
import { StripeModal } from '../ui/StripeModal';
import { ContactForm } from '../ui/ContactForm';
import { Button } from '../ui/Button';

interface PricingProps {
  mapData?: {
    members: any[];
    center: [number, number];
    options: any;
  };
}

export function Pricing({ mapData }: PricingProps) {
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'paid'>('free');

  const handlePlanChange = (plan: 'free' | 'paid') => {
    setSelectedPlan(plan);
  };

  const handleStartTrial = () => {
    setShowStripeModal(true);
  };

  const handleContactSales = () => {
    setShowContactForm(true);
  };

  return (
    <section id="pricing" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
        
        <PricingCalculator onPlanChange={handlePlanChange} />

        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={handleStartTrial} size="lg">
            Start Free Trial
          </Button>
          <Button onClick={handleContactSales} variant="outline" size="lg">
            Contact Sales
          </Button>
        </div>
      </div>

      <StripeModal 
        isOpen={showStripeModal}
        onClose={() => setShowStripeModal(false)}
      />

      <ContactForm
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
      />
    </section>
  );
}
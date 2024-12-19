import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { BetaWaitlistModal } from '../modals/BetaWaitlistModal';
import { scrollToElement } from '../../utils/scrollUtils';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';

export function FeatureComparison() {
  const [showBetaModal, setShowBetaModal] = useState(false);

  const handleUploadClick = () => {
    trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_CREATION.START,
      event_data: { source: 'feature_comparison' }
    });
    scrollToElement('quick-upload', 80);
  };

  return (
    <div id="beta-features" className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
      <div className="p-6 rounded-lg bg-background-white flex flex-col">
        <div className="text-sm font-medium mb-2 text-accent">Available Now</div>
        <h3 className="text-xl font-bold mb-4 text-primary">Free Map Generation</h3>
        <ul className="space-y-3 flex-grow">
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Upload community CSV</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Interactive community map</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Share maps with your community</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Save maps online</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Location search</span>
          </li>
        </ul>
        <Button 
          variant="primary" 
          className="w-full mt-6"
          onClick={handleUploadClick}
        >
          Upload CSV Now
        </Button>
      </div>
      
      <div className="p-6 rounded-lg bg-gradient-to-br from-background-alt to-background flex flex-col">
        <div className="text-sm font-medium mb-2 text-accent">Coming Soon</div>
        <h3 className="text-xl font-bold mb-4 text-primary">Beta Features</h3>
        <ul className="space-y-3 flex-grow">
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Advanced map customization</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">White-label embedding</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Member profiles & photos</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Automatic data sync</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-5 w-5 text-accent" />
            <span className="text-secondary">Priority support</span>
          </li>
        </ul>
        <Button 
          variant="primary" 
          className="w-full mt-6"
          onClick={() => setShowBetaModal(true)}
        >
          Join Beta Waitlist
        </Button>
      </div>

      <BetaWaitlistModal 
        isOpen={showBetaModal} 
        onClose={() => setShowBetaModal(false)}
        source="feature_comparison"
      />
    </div>
  );
}
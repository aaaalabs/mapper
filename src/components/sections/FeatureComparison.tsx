import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Overlay } from '../ui/Overlay';
import { OverlayContent } from '../ui/OverlayContent';
import { OverlayFooter } from '../ui/OverlayFooter';
import { scrollToElement } from '../../utils/scrollUtils';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';

export function FeatureComparison() {
  const [showBetaForm, setShowBetaForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    communityLink: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUploadClick = () => {
    trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_CREATION.START,
      event_data: { source: 'feature_comparison' }
    });
    scrollToElement('map-upload', 80);
  };

  const handleBetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent({
      event_name: 'beta_signup',
      event_data: { ...formData }
    });
    // Here you would typically send the data to your backend
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowBetaForm(false);
      setFormData({ firstName: '', email: '', communityLink: '' });
    }, 2000);
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
          onClick={() => setShowBetaForm(true)}
        >
          Join Beta Waitlist
        </Button>
      </div>

      {/* Beta Signup Form */}
      <Overlay isOpen={showBetaForm} onClose={() => setShowBetaForm(false)}>
        <OverlayContent
          title={showSuccess ? "Thank You!" : "Join Beta Waitlist"}
          description={showSuccess 
            ? "We'll notify you when beta access becomes available."
            : "Get early access to advanced community mapping features"
          }
        >
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600">
                You've been added to our waitlist! We'll be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleBetaSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skool Community Link
                </label>
                <input
                  type="url"
                  required
                  value={formData.communityLink}
                  onChange={(e) => setFormData(prev => ({ ...prev, communityLink: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="https://www.skool.com/your-community"
                />
              </div>
            </form>
          )}
        </OverlayContent>
        {!showSuccess && (
          <OverlayFooter>
            <Button variant="secondary" onClick={() => setShowBetaForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleBetaSubmit}>
              Join Waitlist
            </Button>
          </OverlayFooter>
        )}
      </Overlay>
    </div>
  );
}
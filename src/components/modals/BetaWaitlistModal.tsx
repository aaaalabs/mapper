import React, { useState } from 'react';
import { Overlay } from '../ui/Overlay';
import { OverlayContent } from '../ui/OverlayContent';
import { OverlayFooter } from '../ui/OverlayFooter';
import { Button } from '../ui/Button';
import { createLead } from '../../services/leadService';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';

interface BetaWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BetaWaitlistModal({ isOpen, onClose }: BetaWaitlistModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    communityLink: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = () => {
    return formData.firstName.trim() !== '' && 
           formData.email.trim() !== '' && 
           formData.communityLink.trim() !== '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await trackEvent({
        event_name: 'beta_signup',
        event_data: { ...formData }
      });

      await createLead({
        email: formData.email,
        name: formData.firstName,
        community_link: formData.communityLink,
        lead_type: 'beta_waitlist'
      });

      setShowSuccess(true);
      setFormData({ firstName: '', email: '', communityLink: '' });
    } catch (error) {
      console.error('Error submitting beta form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Overlay isOpen={isOpen} onClose={onClose}>
      <OverlayContent>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {showSuccess ? "Thank You!" : "Join Beta Waitlist"}
          </h2>
          {showSuccess ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg mb-4">
                We've added you to our waitlist! We'll be in touch soon with next steps.
              </p>
              <Button onClick={onClose}>Close</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="communityLink" className="block text-sm font-medium text-gray-700">
                    Skool Community Link
                  </label>
                  <input
                    type="url"
                    id="communityLink"
                    value={formData.communityLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, communityLink: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://skool.com/your-community"
                    required
                  />
                </div>
              </div>
              <OverlayFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid() || isSubmitting}
                >
                  {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                </Button>
              </OverlayFooter>
            </form>
          )}
        </div>
      </OverlayContent>
    </Overlay>
  );
}

import React, { useState, useEffect } from 'react';
import { Overlay } from '../ui/Overlay';
import { Button } from '../ui/Button';
import { createLead } from '../../services/leadService';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';

interface BetaWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string; // Track where the modal was opened from
}

export function BetaWaitlistModal({ isOpen, onClose, source = 'default' }: BetaWaitlistModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    communityLink: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkError, setLinkError] = useState('');

  const validateCommunityLink = (link: string): boolean => {
    if (!link) {
      return false;
    }
    
    const skoolRegex = /^https:\/\/skool\.com\/[a-zA-Z0-9-_]+$/;
    return skoolRegex.test(link);
  };

  const isFormValid = () => {
    return formData.firstName.trim() !== '' && 
           formData.email.trim() !== '' && 
           validateCommunityLink(formData.communityLink);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCommunityLink(formData.communityLink)) {
      setLinkError('Please enter a valid Skool community link (e.g., https://skool.com/community-name)');
      return;
    }
    
    setIsSubmitting(true);

    try {
      await trackEvent({
        event_name: 'beta_signup',
        event_data: { 
          ...formData,
          source // Track where the signup came from
        }
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

  useEffect(() => {
    if (isOpen) {
      setFormData({ firstName: '', email: '', communityLink: '' });
      setShowSuccess(false);
      setLinkError('');
    }
  }, [isOpen]);

  return (
    <Overlay isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Join Beta Waitlist
        </h2>

        {showSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg mb-4 text-gray-700 dark:text-gray-200">
              We've added you to our waitlist! We'll be in touch soon with next steps.
            </p>
            <Button onClick={onClose} variant="secondary">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="space-y-6">
              <div>
                <input
                  type="text"
                  id="firstName"
                  placeholder="Your Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                    bg-white dark:bg-gray-800 
                    text-gray-900 dark:text-white 
                    focus:outline-none focus:ring-2 focus:ring-[#F99D7C] focus:border-transparent
                    placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <input
                  type="email"
                  id="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 
                    bg-white dark:bg-gray-800 
                    text-gray-900 dark:text-white 
                    focus:outline-none focus:ring-2 focus:ring-[#F99D7C] focus:border-transparent
                    placeholder-gray-400 dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <input
                  type="url"
                  id="communityLink"
                  placeholder="Your Skool Community Link"
                  value={formData.communityLink}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFormData(prev => ({ ...prev, communityLink: newValue }));
                    // Clear error when user starts typing
                    if (linkError) {
                      setLinkError('');
                    }
                  }}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#F99D7C] focus:border-transparent
                    bg-white dark:bg-gray-800 
                    text-gray-900 dark:text-white 
                    placeholder-gray-400 dark:placeholder-gray-500
                    ${linkError 
                      ? "border-red-500 dark:border-red-400" 
                      : "border-gray-200 dark:border-gray-700"}`}
                  required
                />
                {linkError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {linkError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className={!isFormValid() || isSubmitting ? "opacity-50" : ""}
              >
                Join Waitlist
              </Button>
            </div>
          </form>
        )}
      </div>
    </Overlay>
  );
}

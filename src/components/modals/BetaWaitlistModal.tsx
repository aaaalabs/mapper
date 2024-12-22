import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { trackErrorWithContext, ErrorSeverity, ErrorCategory } from '../../services/analytics';
import { createLead, LeadType, LeadStatus } from '../../services/leadService';

interface BetaWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string; // Track where the modal was opened from
}

export function BetaWaitlistModal({ isOpen, onClose, source = 'default' }: BetaWaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [communityLink, setCommunityLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email || !name || !communityLink) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const sessionId = localStorage.getItem('session_id');

      await createLead({
        email,
        name,
        community_link: communityLink,
        lead_type: 'beta_waitlist' as LeadType,
        status: 'pending' as LeadStatus,
        session_id: sessionId || undefined,
        event_data: {
          source,
          timestamp: new Date().toISOString()
        }
      });

      setShowSuccess(true);
      setEmail('');
      setName('');
      setCommunityLink('');
    } catch (error) {
      console.error('Error submitting to waitlist:', error);
      const message = error instanceof Error ? error.message : 'Failed to join waitlist';
      setError(message);
      trackErrorWithContext(error instanceof Error ? error : new Error(message), {
        category: ErrorCategory.LEAD,
        subcategory: 'BETA_WAITLIST',
        severity: ErrorSeverity.HIGH,
        metadata: {
          email,
          error: message
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setName('');
      setCommunityLink('');
      setShowSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded bg-white dark:bg-gray-800 p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            Join the Beta Waitlist
          </Dialog.Title>

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
              <Button onClick={onClose} variant="outline">Close</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                placeholder="Community Link"
                value={communityLink}
                onChange={(e) => setCommunityLink(e.target.value)}
              />

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-end space-x-2">
                <Button onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? 'Joining...' : 'Join Waitlist'}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

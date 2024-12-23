import { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';
import { trackEvent, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from '../../services/analytics';
import { ANALYTICS_EVENTS } from '../../services/analytics';
import { createLead } from '../../services/leadService';
import type { LeadInsert } from '../../types/lead';

interface BetaWaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BetaWaitlistModal({ isOpen, onClose }: BetaWaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [skoolUrl, setSkoolUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateSkoolUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'skool.com' && urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!validateSkoolUrl(skoolUrl)) {
      setError('Please enter a valid Skool URL (https://skool.com/...)');
      setIsSubmitting(false);
      return;
    }

    try {
      await createLead({
        email,
        name,
        community_link: skoolUrl,
        lead_type: 'beta_waitlist',
        status: 'pending',
        event_data: {
          source: 'beta_modal',
          skool_url: skoolUrl
        }
      });

      await trackEvent({
        event_name: ANALYTICS_EVENTS.BETA.WAITLIST_JOIN,
        event_data: {
          email_provided: true,
          source: 'beta_modal',
          skool_url: skoolUrl
        }
      });

      setIsSuccess(true);
    } catch (error) {
      setError('Failed to join waitlist. Please try again.');
      trackError(error instanceof Error ? error : new Error('Failed to join waitlist'), {
        category: ERROR_CATEGORY.LEAD,
        severity: ERROR_SEVERITY.HIGH,
        metadata: { source: 'beta_modal', skool_url: skoolUrl }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Join the Beta Waitlist
            </h3>
            <p className="text-sm text-muted-foreground">
              Get early access to our advanced features
            </p>
          </div>

          {isSuccess ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">
                Thanks for joining! We'll be in touch soon.
              </p>
              <Button onClick={onClose} className="mt-4 w-full">
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your full name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <label htmlFor="skoolUrl" className="block text-sm font-medium text-foreground">
                    Skool Website Link
                  </label>
                  <Input
                    id="skoolUrl"
                    type="url"
                    value={skoolUrl}
                    onChange={(e) => setSkoolUrl(e.target.value)}
                    required
                    placeholder="https://skool.com/your-community"
                    pattern="https://skool\.com/.*"
                    className="mt-1"
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    Must be a valid Skool URL (https://skool.com/...)
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="flex flex-col space-y-2">
                  <Button type="submit" isLoading={isSubmitting} className="w-full">
                    Join Waitlist
                  </Button>
                  <Button onClick={onClose} variant="outline" className="w-full">
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Dialog>
  );
}

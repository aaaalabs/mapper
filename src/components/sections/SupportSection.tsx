import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Overlay } from '../ui/Overlay';
import { OverlayContent } from '../ui/OverlayContent';
import { OverlayFooter } from '../ui/OverlayFooter';
import { Check } from 'lucide-react';
import { createLead } from '../../services/leadService';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';
import { useNavigate } from 'react-router-dom';
import { createRevolutOrder } from '../../services/paymentService';

declare global {
  interface Window {
    RevolutCheckout: any;
  }
}

export function SupportSection() {
  const [showExtractionForm, setShowExtractionForm] = useState(false);
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    communityLink: 'https://skool.com/MYCOMMUNITY'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadScript = async () => {
      if (!document.getElementById('revolut-checkout')) {
        const script = document.createElement('script');
        script.id = 'revolut-checkout';
        script.src = 'https://sandbox-merchant.revolut.com/embed.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        return new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    };

    if (showExtractionForm) {
      loadScript().catch(error => {
        console.error('Error loading Revolut script:', error);
        setError('Failed to load payment system. Please try again.');
      });
    }

    return () => {
      const scriptElement = document.getElementById('revolut-checkout');
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
    };
  }, [showExtractionForm]);

  const extractSkoolUid = (communityLink: string): string => {
    try {
      const url = new URL(communityLink);
      const pathParts = url.pathname.split('/').filter(Boolean);
      return pathParts[pathParts.length - 1] || '';
    } catch {
      return '';
    }
  };

  const isFormValid = () => {
    return formData.name.trim() !== '' && 
           formData.email.trim() !== '' && 
           formData.communityLink.trim() !== '';
  };

  const handleScheduleDemo = () => {
    window.open('https://voiceloop.fillout.com/Demo', '_blank');
  };

  const handleExtractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await trackEvent({
        event_name: ANALYTICS_EVENTS.DATA_EXTRACTION.REQUEST,
        event_data: { ...formData }
      });

      await createLead({
        email: formData.email,
        name: formData.name,
        lead_type: 'data_extraction',
        status: 'pending',
        source: 'extraction_form',
        community_link: formData.communityLink,
        event_data: {
          community_link: formData.communityLink
        }
      });

      // Create Revolut order
      const { publicId } = await createRevolutOrder({
        amount: 990, // €9.90 in cents
        currency: 'EUR',
        customerEmail: formData.email
      });

      // Initialize Revolut Checkout
      const RC = await window.RevolutCheckout(publicId, {
        locale: 'en',
        publicKey: import.meta.env.VITE_REVOLUT_SANDBOX_PK
      });

      // Track payment initiation
      await trackEvent({
        event_name: 'payment_initiated',
        event_data: {
          amount: 990,
          currency: 'EUR',
          service: 'data_extraction'
        }
      });

      // Open payment modal
      RC.payWithPopup({
        onSuccess() {
          // Track successful payment
          trackEvent({
            event_name: 'payment_completed',
            event_data: {
              amount: 990,
              currency: 'EUR',
              service: 'data_extraction'
            }
          });
          
          const skoolUid = extractSkoolUid(formData.communityLink);
          
          // Navigate to order confirmation page
          navigate('/order', { 
            state: { 
              email: formData.email,
              name: formData.name,
              skoolUid
            }
          });
        },
        onError(error: any) {
          console.error('Payment error:', error);
          setError('Payment failed. Please try again.');
          setIsSubmitting(false);
          trackEvent({
            event_name: 'payment_failed',
            event_data: {
              error: error.message,
              service: 'data_extraction'
            }
          });
        },
        onCancel() {
          setError('Payment was cancelled.');
          setIsSubmitting(false);
          trackEvent({
            event_name: 'payment_cancelled',
            event_data: {
              service: 'data_extraction'
            }
          });
        }
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl p-8 text-center mb-16 bg-[#F2E2CE] border border-[#E9B893]/30 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-3 text-[#1D3640] bg-clip-text">
          Looking for a Shortcut?
        </h2>
        <p className="mb-8 text-[#3D4F4F] text-lg">
          Skip the learning curve. Let our experts handle the technical setup for you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
          <Button 
            variant="outline"
            onClick={handleScheduleDemo}
            className="group relative w-full sm:w-[280px] h-[160px] bg-white border-2 border-[#E9B893] hover:border-[#F99D7C] hover:bg-[#F3EDE5] transition-all duration-300"
          >
            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-3 text-xs text-[#F99D7C] font-medium">
              Free
            </span>
            <div className="flex flex-col items-center justify-center h-full">
              <span className="font-semibold text-[#1D3640] text-lg">Schedule Demo Call</span>
              <span className="text-sm text-[#3D4F4F] mt-2 group-hover:text-[#F99D7C] transition-colors">
                Get personalized guidance
              </span>
            </div>
          </Button>
          <div className="hidden sm:flex items-center text-[#A3A692]">or</div>
          <Button 
            variant="outline"
            onClick={() => setShowExtractionForm(true)}
            className="group relative w-full sm:w-[280px] h-[160px] bg-white border-2 border-[#F99D7C] hover:border-[#1D3640] hover:bg-[#F3EDE5] transition-all duration-300"
          >
            <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-3 text-xs text-[#1D3640] font-medium">
              Premium
            </span>
            <div className="flex flex-col items-center justify-center h-full">
              <span className="font-semibold text-[#1D3640] text-lg">Book Data Extraction</span>
              <span className="font-medium text-[#F99D7C] mt-2 text-lg">€9.90</span>
              <span className="text-sm text-[#3D4F4F] mt-2 group-hover:text-[#1D3640] transition-colors">
                Let us do it for you
              </span>
            </div>
          </Button>
        </div>
        
        <div className="mt-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F2E2CE] via-transparent to-[#F2E2CE] z-10"></div>
          <p className="relative z-20 text-sm text-[#A3A692] max-w-md mx-auto italic">
            "Join the smart ones who saved hours of setup time"
          </p>
        </div>
      </div>

      {/* Data Extraction Form Modal */}
      <Overlay isOpen={showExtractionForm} onClose={() => setShowExtractionForm(false)}>
        <OverlayContent
          title="Book Data Extraction"
          description={
            <div className="space-y-2 text-[#3D4F4F]">
              <p>
                To create your community map, we'll collect location data from your Skool members' LinkedIn profiles.
              </p>
              <p className="text-sm text-[#A3A692] italic">
                Note: Only members with LinkedIn profiles and shared locations will appear on the map.
              </p>
            </div>
          }
        >
          <form onSubmit={handleExtractionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
            <OverlayFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowExtractionForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Book Now (€9.90)'}
              </Button>
            </OverlayFooter>
          </form>
        </OverlayContent>
      </Overlay>
    </div>
  );
}
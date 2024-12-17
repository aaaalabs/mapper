import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { createRevolutOrder } from '../services/paymentService';
import { trackEvent } from '../services/analytics';

declare global {
  interface Window {
    RevolutCheckout: any;
  }
}

export function SubscriptionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { email, name, communityLink } = location.state || {};

  useEffect(() => {
    // Load Revolut Checkout script
    const script = document.createElement('script');
    script.src = 'https://cdn.revolut.com/revolut-checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create order
      const { publicId } = await createRevolutOrder({
        amount: 990, // €9.90 in cents
        currency: 'EUR',
        customerEmail: email
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
          
          // Redirect to booking page
          navigate('/booking', { 
            state: { 
              email,
              name,
              communityLink,
              paymentCompleted: true
            }
          });
        },
        onError(error: any) {
          console.error('Payment error:', error);
          setError('Payment failed. Please try again.');
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
          trackEvent({
            event_name: 'payment_cancelled',
            event_data: {
              service: 'data_extraction'
            }
          });
        },
      });
    } catch (err) {
      console.error('Error initiating payment:', err);
      setError('Failed to initiate payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !name || !communityLink) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Invalid Access</h2>
          <p className="text-secondary mb-8">
            Please fill out the data extraction form first.
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-background-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-primary mb-8">
            Data Extraction Service
          </h2>
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-secondary">One-time Service</span>
              <span className="text-2xl font-bold text-primary">€9.90</span>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-primary mb-4">
                Service includes:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center text-secondary">
                  <svg className="h-5 w-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Professional Data Extraction
                </li>
                <li className="flex items-center text-secondary">
                  <svg className="h-5 w-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Map Setup & Configuration
                </li>
                <li className="flex items-center text-secondary">
                  <svg className="h-5 w-5 text-accent mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Priority Support
                </li>
              </ul>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-secondary">
                After successful payment, you'll be redirected to book your Data Extraction Session.
              </p>

              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full justify-center"
              >
                {isLoading ? 'Processing...' : 'Pay €9.90'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { createRevolutOrder } from '../services/paymentService';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';

declare global {
  interface Window {
    RevolutCheckout: any;
  }
}

export function SubscriptionPage() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { email, name, communityLink } = location.state || {};

  useEffect(() => {
    const loadScript = async () => {
      if (!document.getElementById('revolut-checkout')) {
        const script = document.createElement('script');
        script.id = 'revolut-checkout';
        script.src = 'https://sandbox-merchant.revolut.com/embed.js';
        script.async = true;
        script.crossOrigin = 'anonymous';
        
        // Return a promise that resolves when the script is loaded
        return new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    };

    loadScript().catch(error => {
      console.error('Error loading Revolut script:', error);
      setError('Failed to load payment system. Please try again.');
    });

    return () => {
      const scriptElement = document.getElementById('revolut-checkout');
      if (scriptElement) {
        document.head.removeChild(scriptElement);
      }
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
        event_name: ANALYTICS_EVENTS.PAYMENT.INITIATED,
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
            event_name: ANALYTICS_EVENTS.PAYMENT.COMPLETED,
            event_data: {
              amount: 990,
              currency: 'EUR',
              service: 'data_extraction'
            }
          });
          
          // Redirect to fillout.com booking page
          const bookingUrl = `https://voiceloop.fillout.com/t/rfGJsPbos6us?name=${encodeURIComponent(name || '')}&email=${encodeURIComponent(email || '')}`;
          window.location.href = bookingUrl;
        },
        onError(error: any) {
          console.error('Payment error:', error);
          setError('Payment failed. Please try again.');
          setIsLoading(false);
          trackEvent({
            event_name: ANALYTICS_EVENTS.PAYMENT.FAILED,
            event_data: {
              error: error.message,
              service: 'data_extraction'
            }
          });
        },
        onCancel() {
          setError('Payment was cancelled.');
          setIsLoading(false);
          trackEvent({
            event_name: ANALYTICS_EVENTS.PAYMENT.CANCELLED,
            event_data: {
              service: 'data_extraction'
            }
          });
        }
      });
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
      setIsLoading(false);
    }
  };

  if (!email || !name) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Missing required information. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Complete Your Purchase</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
          <p>Data Extraction Service: €9.90</p>
          <p className="text-sm text-gray-600">Email: {email}</p>
        </div>
        <Button
          onClick={handlePayment}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : 'Pay €9.90'}
        </Button>
      </div>
    </div>
  );
}

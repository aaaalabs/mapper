import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { trackEvent, ANALYTICS_EVENTS, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from '../services/analytics';
import { createLead } from '../services/leadService';

export function OrderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, name, skoolUid } = location.state || {};

  useEffect(() => {
    if (!email || !name) {
      navigate('/');
      return;
    }

    const trackOrder = async () => {
      try {
        const sessionId = localStorage.getItem('session_id');

        // Create lead for the order
        await createLead({
          email,
          name,
          lead_type: 'data_extraction',
          status: 'pending',
          session_id: sessionId,
          event_data: {
            skoolUid,
            source: 'order_page'
          }
        });

        // Track order completion view
        await trackEvent({
          event_name: ANALYTICS_EVENTS.ORDER.COMPLETION_VIEW,
          event_data: {
            service: 'data_extraction',
            skoolUid,
            session_id: sessionId
          }
        });
      } catch (error) {
        console.error('Error processing order:', error);
        trackError(error instanceof Error ? error : new Error('Failed to process order'), {
          category: ERROR_CATEGORY.LEAD,
          subcategory: 'ORDER',
          severity: ERROR_SEVERITY.HIGH,
          metadata: {
            email,
            name,
            skoolUid,
            error: error instanceof Error ? error.message : String(error)
          }
        });
      }
    };

    trackOrder();
  }, [email, name, navigate, skoolUid]);

  useEffect(() => {
    const trackPageView = async () => {
      try {
        await trackEvent({
          event_name: ANALYTICS_EVENTS.ORDER.COMPLETION_VIEW,
          event_data: {
            timestamp: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error('Failed to track order completion view:', err);
      }
    };

    trackPageView();
  }, []);

  const handleContinueToBooking = () => {
    const bookingUrl = `https://voiceloop.fillout.com/t/rfGJsPbos6us?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&skool=${encodeURIComponent(skoolUid)}`;
    window.open(bookingUrl, '_blank');
  };

  if (!email || !name) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order Confirmation
            </h1>
            <div className="mt-4">
              <p className="text-gray-600 dark:text-gray-300">
                Thank you for your interest in our data extraction service! Click below to schedule a quick call to discuss your needs.
              </p>
            </div>
            <div className="mt-6">
              <Button onClick={handleContinueToBooking}>
                Schedule Call
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* <BetaWaitlistModal isOpen={false} onClose={() => {}} /> */}
    </div>
  );
}

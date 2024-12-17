import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';
import { BetaWaitlistModal } from '../components/modals/BetaWaitlistModal';

export function OrderPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, name, skoolUid } = location.state || {};
  const [showBetaModal, setShowBetaModal] = useState(false);

  useEffect(() => {
    if (!email || !name) {
      navigate('/');
      return;
    }

    // Track order completion view
    trackEvent({
      event_name: ANALYTICS_EVENTS.ORDER.COMPLETION_VIEW,
      event_data: {
        service: 'data_extraction'
      }
    });
  }, [email, name, navigate]);

  const handleContinueToBooking = () => {
    const bookingUrl = `https://voiceloop.fillout.com/t/rfGJsPbos6us?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&skool=${encodeURIComponent(skoolUid)}`;
    window.location.href = bookingUrl;
  };

  if (!email || !name) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-background-alt">
      <div className="max-w-2xl w-full p-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mb-2">Thank you for your purchase</p>
          </div>

          <div className="border-t border-b border-gray-200 py-4 mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">Data Extraction Session</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Amount paid:</span>
              <span className="font-medium">€9.90</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{email}</span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2">Next Steps</h2>
            <p className="text-gray-600 mb-4">
              Please schedule your Data Extraction Session for your Skool community. 
              Our team will guide you through the process.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              If you have any questions, feel free to reach out to{' '}
              <a href="mailto:contact@voiceloop.io" className="text-blue-500 hover:text-blue-600">
                contact@voiceloop.io
              </a>
            </p>
          </div>

          <Button
            onClick={handleContinueToBooking}
            className="w-full max-w-md mx-auto"
          >
            Schedule Your Session
          </Button>
        </div>
      </div>
      <BetaWaitlistModal isOpen={showBetaModal} onClose={() => setShowBetaModal(false)} />
    </div>
  );
}

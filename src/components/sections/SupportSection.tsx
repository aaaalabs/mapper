import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Overlay } from '../ui/Overlay';
import { OverlayContent } from '../ui/OverlayContent';
import { OverlayFooter } from '../ui/OverlayFooter';
import { Check } from 'lucide-react';

export function SupportSection() {
  const [showExtractionForm, setShowExtractionForm] = useState(false);
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    communityLink: ''
  });

  // Load Fillout script when demo form is opened
  useEffect(() => {
    if (showDemoForm) {
      const script = document.createElement('script');
      script.src = 'https://server.fillout.com/embed/v1/';
      script.async = true;
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [showDemoForm]);

  const handleExtractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Data extraction request:', formData);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowExtractionForm(false);
      setFormData({ name: '', email: '', communityLink: '' });
    }, 2000);
  };

  return (
    <div className="rounded-xl p-8 text-center mb-16 bg-background-white">
      <h2 className="text-2xl font-bold mb-4 text-primary">Need Help Getting Started?</h2>
      <p className="mb-6 text-secondary">
        Let us handle the data extraction and setup for you.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          variant="secondary"
          onClick={() => setShowExtractionForm(true)}
        >
          Book Data Extraction (€9.90)
        </Button>
        <Button 
          variant="secondary"
          onClick={() => setShowDemoForm(true)}
        >
          Schedule Demo Call
        </Button>
      </div>

      {/* Data Extraction Form */}
      <Overlay isOpen={showExtractionForm} onClose={() => setShowExtractionForm(false)}>
        <OverlayContent
          title={showSuccess ? "Thank You!" : "Book Data Extraction"}
          description={showSuccess 
            ? "We'll reach out to you shortly to process your request."
            : "Let us handle the data extraction from your Skool community"
          }
        >
          {showSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600">
                We've received your request and will contact you soon!
              </p>
            </div>
          ) : (
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
            </form>
          )}
        </OverlayContent>
        {!showSuccess && (
          <OverlayFooter>
            <Button variant="secondary" onClick={() => setShowExtractionForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleExtractionSubmit}>
              Book Now (€9.90)
            </Button>
          </OverlayFooter>
        )}
      </Overlay>

      {/* Demo Call Form */}
      <Overlay 
        isOpen={showDemoForm} 
        onClose={() => setShowDemoForm(false)}
        className="w-[80vw] max-w-4xl"
      >
        <OverlayContent>
          <div 
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%'
            }}
          >
            <div 
              data-fillout-id="jwmqMMXUsnus" 
              data-fillout-embed-type="fullscreen" 
              style={{ width: '100%', height: '100%' }}
              data-fillout-inherit-parameters
            />
          </div>
        </OverlayContent>
      </Overlay>
    </div>
  );
}
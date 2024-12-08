import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Map } from '../Map';
import { generateDemoMembers } from '../../utils/demoData';
import { calculateMapCenter } from '../../utils/mapUtils';
import { CommunityMember } from '../../types';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';

// Add new event types
const LANDING_EVENTS = {
  DEMO_MAP_INTERACTION: 'demo_map_interaction',
  CTA_CLICK: 'cta_click',
  SCROLL_DEPTH: 'scroll_depth'
} as const;

export function HeroSection() {
  const [demoMembers, setDemoMembers] = useState<CommunityMember[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [hasInteractedWithDemo, setHasInteractedWithDemo] = useState(false);

  useEffect(() => {
    const members = generateDemoMembers();
    setDemoMembers(members);
    setMapCenter(calculateMapCenter(members));

    // Track scroll depth
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= 25 && !localStorage.getItem('tracked_25_scroll')) {
        trackEvent({ event_name: LANDING_EVENTS.SCROLL_DEPTH, event_data: { depth: 25 } });
        localStorage.setItem('tracked_25_scroll', 'true');
      }
      if (scrollPercent >= 50 && !localStorage.getItem('tracked_50_scroll')) {
        trackEvent({ event_name: LANDING_EVENTS.SCROLL_DEPTH, event_data: { depth: 50 } });
        localStorage.setItem('tracked_50_scroll', 'true');
      }
      if (scrollPercent >= 75 && !localStorage.getItem('tracked_75_scroll')) {
        trackEvent({ event_name: LANDING_EVENTS.SCROLL_DEPTH, event_data: { depth: 75 } });
        localStorage.setItem('tracked_75_scroll', 'true');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDemoInteraction = () => {
    if (!hasInteractedWithDemo) {
      trackEvent({
        event_name: LANDING_EVENTS.DEMO_MAP_INTERACTION,
        event_data: { first_interaction: true }
      });
      setHasInteractedWithDemo(true);
    }
  };

  const scrollToUpload = () => {
    trackEvent({
      event_name: LANDING_EVENTS.CTA_CLICK,
      event_data: { button: 'create_your_map' }
    });
    
    const uploadSection = document.querySelector('#quick-upload');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="text-center px-4 sm:px-6">
      <div className="rounded-full px-3 py-1 sm:px-4 sm:py-2 inline-block mb-6 bg-background-alt">
        <p className="text-sm font-medium text-primary">
          Built by the team that connected 80+ AAA members
        </p>
      </div>
      
      <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 text-primary">
        Transform Your Skool Community
        <br className="hidden sm:block" />
        <span className="gradient-text">
          Into An Interactive Map
        </span>
      </h1>

      <p className="text-lg sm:text-xl mx-auto mb-6 sm:mb-8 text-secondary max-w-2xl">
        Get started instantly with CSV upload or explore our interactive demo below.
      </p>

      <div 
        className="rounded-xl p-2 sm:p-4 mb-6 sm:mb-8 bg-background-white"
        onClick={handleDemoInteraction}
      >
        <div className="aspect-video rounded-lg overflow-hidden mb-4">
          {demoMembers.length > 0 && mapCenter && (
            <Map 
              members={demoMembers}
              center={mapCenter}
              zoom={2}
            />
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button 
            variant="primary" 
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
            onClick={scrollToUpload}
          >
            Create Your Map
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-tertiary px-4">
        ⚡️ No sign-up required • Free to use • Export and embed anywhere
      </p>
    </div>
  );
}
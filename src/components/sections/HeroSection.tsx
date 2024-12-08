import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Map } from '../Map';
import { generateDemoMembers } from '../../utils/demoData';
import { calculateMapCenter } from '../../utils/mapUtils';
import { CommunityMember } from '../../types';

export function HeroSection() {
  const [demoMembers, setDemoMembers] = useState<CommunityMember[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const members = generateDemoMembers(50);
    setDemoMembers(members);
    setMapCenter(calculateMapCenter(members));
  }, []);

  const scrollToUpload = () => {
    const uploadSection = document.querySelector('#quick-upload');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="text-center">
      <div className="rounded-full px-4 py-2 inline-block mb-6 bg-background-alt">
        <p className="text-sm font-medium text-primary">
          Built by the team that connected 80+ AAA members through AI
        </p>
      </div>
      
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
        Transform Your Community Into An
        <br />
        <span className="gradient-text">
          Interactive Global Map
        </span>
      </h1>

      <p className="text-xl mx-auto mb-8 text-secondary max-w-2xl">
        Get started instantly with CSV upload or explore our interactive demo below.
      </p>

      <div className="rounded-xl p-4 mb-8 bg-background-white">
        <div className="aspect-video rounded-lg overflow-hidden mb-4">
          {demoMembers.length > 0 && mapCenter && (
            <Map 
              members={demoMembers}
              center={mapCenter}
              zoom={2}
            />
          )}
        </div>
        <div className="flex justify-center gap-4">
          <Button 
            variant="primary" 
            className="flex items-center justify-center gap-2"
            onClick={scrollToUpload}
          >
            Create Your Map
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <p className="text-sm text-tertiary">
        ⚡️ No sign-up required • Free to use • Export and embed anywhere
      </p>
    </div>
  );
}
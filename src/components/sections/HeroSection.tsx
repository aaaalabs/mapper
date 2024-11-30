import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { MapShowcase } from '../MapShowcase';
import { generateDemoMembers } from '../../utils/demoData';
import { calculateMapCenter } from '../../utils/mapUtils';
import { CommunityMember } from '../../types';
import { Map } from '../Map';

export function HeroSection() {
  const [demoMembers, setDemoMembers] = useState<CommunityMember[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 0]);
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    const members = generateDemoMembers(50);
    setDemoMembers(members);
    setMapCenter(calculateMapCenter(members));
  }, []);

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
        Get started instantly with CSV upload or join the beta for advanced features.
      </p>

      <div className="rounded-xl p-4 mb-12 bg-background-white">
        <div className="aspect-video rounded-lg overflow-hidden mb-4">
          {demoMembers.length > 0 && mapCenter && (
            showExamples ? (
              <MapShowcase 
                members={demoMembers}
                center={mapCenter}
                isVisible={showExamples}
                onClose={() => setShowExamples(false)}
              />
            ) : (
              <Map 
                members={demoMembers}
                center={mapCenter}
              />
            )
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="primary" className="flex items-center justify-center gap-2">
            View Live Demo Map
            <ArrowRight className="h-5 w-5" />
          </Button>
          {!showExamples && (
            <Button 
              variant="secondary"
              onClick={() => setShowExamples(true)}
            >
              See More Examples
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
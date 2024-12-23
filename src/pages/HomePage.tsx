import React, { useState, useCallback } from 'react';
import { HeroSection } from '../components/sections/HeroSection';
import { QuickUpload } from '../components/sections/QuickUpload';
import { FeatureComparison } from '../components/sections/FeatureComparison';
import { SupportSection } from '../components/sections/SupportSection';
import { TestimonialSection } from '../components/sections/TestimonialSection';
import { ShareModal } from '../components/ShareModal';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';

export function HomePage() {
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [mapData, setMapData] = useState<{ id: string; name: string; shareLink: string } | null>(null);

  const handleMapCreated = useCallback((mapId: string, mapName: string, shareLink: string) => {
    setMapData({ id: mapId, name: mapName, shareLink });
    setShareModalOpen(true);

    // Track map share event
    trackEvent({
      event_name: ANALYTICS_EVENTS.MAP.SHARED,
      event_data: {
        map_id: mapId,
        share_type: 'creation'
      }
    });
  }, []);

  return (
    <>
      <HeroSection />
      <QuickUpload onMapCreated={handleMapCreated} />
      <FeatureComparison />
      <SupportSection />
      <TestimonialSection />

      {mapData && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          mapId={mapData.id}
          initialMapName={mapData.name}
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Your map has been created successfully! Share it with your community.
            </p>
          </div>
        </ShareModal>
      )}
    </>
  );
}

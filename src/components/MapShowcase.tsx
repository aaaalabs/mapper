import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { CommunityMap } from './CommunityMap';
import { mapVersions } from '../utils/mapVersions';
import { CommunityMember } from '../types';
import { Button } from './ui/Button';
import { useSwipeable } from 'react-swipeable';

interface MapShowcaseProps {
  members: CommunityMember[];
  center: [number, number];
  onClose: () => void;
  isVisible: boolean;
}

export function MapShowcase({ members, center, onClose, isVisible }: MapShowcaseProps) {
  const [currentVersion, setCurrentVersion] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const handleNext = () => {
    if (isTransitioning || currentVersion === mapVersions.length - 1) return;
    setIsTransitioning(true);
    setCurrentVersion((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (isTransitioning || currentVersion === 0) return;
    setIsTransitioning(true);
    setCurrentVersion((prev) => prev - 1);
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handlePrev(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  useEffect(() => {
    setMapError(null);
  }, [currentVersion]);

  const version = mapVersions[currentVersion];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center">
      <div className="relative w-[70vw] mx-auto" {...handlers}>
        {/* Close Button */}
        <div className="absolute -top-12 right-0 z-[1000]">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="!p-2 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Map Container */}
        <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
          <div 
            className={`absolute inset-0 transition-opacity duration-300 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {mapError ? (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <p className="text-red-500">{mapError}</p>
              </div>
            ) : (
              <CommunityMap
                members={members}
                center={center}
                options={{
                  markerStyle: version.options.markerStyle === 'custom' ? 'pins' : version.options.markerStyle,
                  enableClustering: version.options.enableClustering,
                  enableSearch: false,
                  enableFullscreen: true,
                  enableSharing: false
                }}
                mapStyle={version.style}
                customOptions={version.options.customOptions}
                onError={(error) => setMapError(error)}
              />
            )}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrev}
              disabled={currentVersion === 0}
              className={`p-2 ${
                currentVersion === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="text-sm font-medium text-primary">
              <span className="font-bold">{currentVersion + 1}</span>
              <span className="mx-1">/</span>
              <span>{mapVersions.length}</span>
              <span className="mx-2">-</span>
              <span>{version.name}</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleNext}
              disabled={currentVersion === mapVersions.length - 1}
              className={`p-2 ${
                currentVersion === mapVersions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 flex gap-2">
          {mapVersions.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentVersion
                  ? 'bg-accent w-4'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => {
                setIsTransitioning(true);
                setCurrentVersion(index);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
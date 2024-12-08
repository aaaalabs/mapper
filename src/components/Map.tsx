import React, { useState, forwardRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Share2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { CommunityMember } from '../types';
import { trackEvent, ANALYTICS_EVENTS } from '../services/analytics';
import 'leaflet/dist/leaflet.css';

// Initialize leaflet icons
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to handle tile loading events and map interactions
function MapEventHandler({ onLoad, onError }: { onLoad: () => void; onError: () => void }) {
  const map = useMap();

  useEffect(() => {
    const handleLoad = () => {
      onLoad();
    };

    const handleError = () => {
      onError();
    };

    map.on('tileload', handleLoad);
    map.on('tileerror', handleError);

    return () => {
      map.off('tileload', handleLoad);
      map.off('tileerror', handleError);
    };
  }, [map, onLoad, onError]);

  return null;
}

interface MapProps {
  members: CommunityMember[];
  center?: [number, number];
  zoom?: number;
  isLoading?: boolean;
  hideShareButton?: boolean;
  onShare?: () => void;
}

export const Map = forwardRef<HTMLDivElement, MapProps>(({
  members,
  center = [0, 0],
  zoom = 2,
  isLoading = false,
  hideShareButton = false,
  onShare,
}, ref) => {
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [tilesError, setTilesError] = useState(false);

  const handleTileLoad = () => {
    setTilesLoaded(true);
  };

  const handleTileError = () => {
    setTilesError(true);
  };

  const handleShare = async () => {
    trackEvent({ event_name: ANALYTICS_EVENTS.MAP_SHARE });
    
    const shareData = {
      title: 'Mapper - Community Visualization Tool',
      text: 'Check out this amazing tool for visualizing your community on a map!',
      url: 'https://mapper.voiceloop.io'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleMarkerClick = (member: CommunityMember) => {
    trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_INTERACTION.MARKER_CLICK,
      event_data: { member_name: member.name }
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventHandler onLoad={handleTileLoad} onError={handleTileError} />
        
        {members.map((member, index) => (
          <Marker
            key={`${member.name}-${index}`}
            position={[parseFloat(member.latitude), parseFloat(member.longitude)]}
            eventHandlers={{
              click: () => handleMarkerClick(member)
            }}
          >
            <Popup>
              <div className="p-1 text-center">
                {member.image && (
                  <div className="mb-1">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover mx-auto"
                    />
                  </div>
                )}
                <h3 className="font-semibold text-sm leading-tight m-0">{member.name}</h3>
                {member.title && (
                  <p className="text-gray-600 text-xs leading-tight m-0">{member.title}</p>
                )}
                <p className="text-gray-500 text-xs leading-tight m-0">{member.location}</p>
                <div className="flex gap-1 justify-center mt-1">
                  {member.website && (
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark text-[10px] transition-colors px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      Website
                    </a>
                  )}
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark text-[10px] transition-colors px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!hideShareButton && (
        <button
          onClick={handleShare}
          className={cn(
            "absolute top-4 right-4 z-[400] bg-white rounded-lg shadow-md p-2",
            "hover:bg-gray-50 transition-colors duration-200"
          )}
          aria-label="Share map"
        >
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {tilesError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <h3 className="text-lg font-medium mb-2">Map Loading Error</h3>
            <p className="text-gray-600">
              There was an error loading the map tiles. Please check your internet connection and try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
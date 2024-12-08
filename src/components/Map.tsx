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
    let loadedTiles = 0;
    let lastZoom = map.getZoom();
    let lastCenter = map.getCenter();
    let interactionTimeout: NodeJS.Timeout;
    
    const handleLoad = () => {
      loadedTiles++;
      if (loadedTiles >= 1) {
        onLoad();
      }
    };

    const handleZoomEnd = () => {
      const newZoom = map.getZoom();
      if (newZoom !== lastZoom) {
        trackEvent({
          event_name: ANALYTICS_EVENTS.MAP_INTERACTION.ZOOM,
          event_data: { from: lastZoom, to: newZoom }
        });
        lastZoom = newZoom;
      }
    };

    const handleMoveEnd = () => {
      clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        const newCenter = map.getCenter();
        if (newCenter.lat !== lastCenter.lat || newCenter.lng !== lastCenter.lng) {
          trackEvent({
            event_name: ANALYTICS_EVENTS.MAP_INTERACTION.PAN,
            event_data: {
              from: [lastCenter.lat, lastCenter.lng],
              to: [newCenter.lat, newCenter.lng]
            }
          });
          lastCenter = newCenter;
        }
      }, 500); // Debounce pan events
    };

    map.on('tileloadstart', () => {
      loadedTiles = 0;
    });
    map.on('tileload', handleLoad);
    map.on('tileerror', onError);
    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('tileloadstart');
      map.off('tileload', handleLoad);
      map.off('tileerror', onError);
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
      clearTimeout(interactionTimeout);
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
  isLoading,
  hideShareButton,
  onShare
}, ref) => {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [invalidMembers, setInvalidMembers] = useState<string[]>([]);

  useEffect(() => {
    // Validate member coordinates
    const invalid = members.filter(member => {
      const lat = parseFloat(member.latitude);
      const lng = parseFloat(member.longitude);
      return isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180;
    }).map(m => m.name);
    
    setInvalidMembers(invalid);
  }, [members]);

  useEffect(() => {
    if (members.length > 0) {
      trackEvent({
        event_name: ANALYTICS_EVENTS.MAP_INTERACTION.VIEW,
        event_data: { members_count: members.length }
      });
    }
  }, [members]);

  const handleTileLoad = () => {
    setTilesLoaded(true);
    setTileError(false);
  };

  const handleTileError = () => {
    setTileError(true);
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  const handleMarkerClick = (member: CommunityMember) => {
    trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_INTERACTION.MARKER_CLICK,
      event_data: { member_name: member.name, location: member.location }
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  if (tileError) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center px-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-600 font-medium">Failed to load map tiles</p>
          <p className="text-xs text-red-500 mt-1">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative h-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={true}
        zoomControl={false}
        ref={setMapInstance}
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEventHandler onLoad={handleTileLoad} onError={handleTileError} />
        
        {members.map((member, index) => {
          const lat = parseFloat(member.latitude);
          const lng = parseFloat(member.longitude);
          
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
          
          return (
            <Marker
              key={`${member.name}-${index}`}
              position={[lat, lng]}
              eventHandlers={{
                click: () => handleMarkerClick(member)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-medium">{member.name}</h3>
                  <p className="text-sm text-gray-600">{member.location}</p>
                  {member.title && (
                    <p className="text-sm text-gray-500">{member.title}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {!tilesLoaded && !tileError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500">Loading tiles...</p>
          </div>
        </div>
      )}

      {invalidMembers.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-yellow-50 rounded-lg p-3 shadow-sm border border-yellow-200 max-w-xs">
          <p className="text-sm text-yellow-800 font-medium">Invalid coordinates found</p>
          <p className="text-xs text-yellow-600 mt-1">
            {invalidMembers.length} member{invalidMembers.length > 1 ? 's' : ''} skipped due to invalid coordinates
          </p>
        </div>
      )}

      {!hideShareButton && (
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-md p-2 hover:bg-gray-50 transition-colors"
          title="Share Map"
        >
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </div>
  );
});
import React, { useState, forwardRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Share2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { CommunityMember } from '../types';
import 'leaflet/dist/leaflet.css';

// Initialize leaflet icons
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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
        
        {members.map((member, index) => {
          const lat = parseFloat(member.latitude);
          const lng = parseFloat(member.longitude);
          
          if (isNaN(lat) || isNaN(lng)) return null;
          
          return (
            <Marker
              key={`${member.name}-${index}`}
              position={[lat, lng]}
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
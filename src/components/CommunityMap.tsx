import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CommunityMember } from '../types';
import { MapStyle } from '../types/map';
import { createMapTileLayer, getPopupContent } from '../utils/mapStyles';

interface CommunityMapProps {
  members: CommunityMember[];
  center: [number, number];
  options: {
    markerStyle: 'pins' | 'photos';
    enableSearch: boolean;
    enableFullscreen: boolean;
    enableSharing: boolean;
    enableClustering: boolean;
  };
  mapStyle?: MapStyle;
  customOptions?: {
    heatmap?: boolean;
    animation?: boolean;
    darkMode?: boolean;
    dynamicSize?: boolean;
  };
  onError?: (error: string) => void;
}

export function CommunityMap({ 
  members, 
  center, 
  options,
  mapStyle = {
    id: 'standard',
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    popupStyle: {
      background: '#FFFFFF',
      text: '#1D3640',
      border: '#E2E8F0',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  },
  customOptions,
  onError 
}: CommunityMapProps) {
  useEffect(() => {
    // Fix Leaflet default icon path issues
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const createIcon = (member: CommunityMember) => {
    if (options.markerStyle === 'photos' && member.image) {
      return new Icon({
        iconUrl: member.image,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: 'rounded-full border-2 border-white shadow-md'
      });
    }
    return new Icon.Default();
  };

  const tileLayer = createMapTileLayer(mapStyle);

  return (
    <MapContainer
      center={center}
      zoom={2}
      className="h-full w-full rounded-lg shadow-soft"
      scrollWheelZoom={true}
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution={tileLayer.options.attribution}
        url={tileLayer.url}
        {...tileLayer.options}
      />
      
      {options.enableClustering ? (
        <MarkerClusterGroup>
          {members.map((member, index) => (
            <Marker
              key={`${member.name}-${index}`}
              position={[parseFloat(member.latitude), parseFloat(member.longitude)]}
              icon={createIcon(member)}
            >
              <Popup>
                <div dangerouslySetInnerHTML={{ __html: getPopupContent(member, mapStyle) }} />
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      ) : (
        members.map((member, index) => (
          <Marker
            key={`${member.name}-${index}`}
            position={[parseFloat(member.latitude), parseFloat(member.longitude)]}
            icon={createIcon(member)}
          >
            <Popup>
              <div dangerouslySetInnerHTML={{ __html: getPopupContent(member, mapStyle) }} />
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
}
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { MapMarker } from './map/MapMarker';
import { MapSettingsWidget } from './map/MapSettingsWidget';
import { CommunityMember } from '../types';
import { MapSettings, defaultMapSettings } from '../types/mapSettings';
import { cn } from '../lib/utils';
import { mapStyles } from '../utils/mapStyles';
import { Search, Share2 } from 'lucide-react';
import L from 'leaflet';
import { ShareModal } from './ShareModal';
import { geocodeLocation } from '../services/geocodingService';
import { Z_INDEX } from '../constants/zIndex';

// Fix Leaflet default marker icon
L.Icon.Default.mergeOptions({
  iconUrl: '/images/leaflet/marker-icon.png',
  iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
});

// Add Leaflet popup styles
const popupStyles = `
  .leaflet-popup-content-wrapper {
    background-color: white;
    color: #1D3640;
    border-radius: 8px;
    padding: 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .leaflet-popup-content {
    margin: 0;
    min-width: 200px;
  }
  .leaflet-popup-tip {
    background-color: white;
  }
  .leaflet-popup {
    margin-bottom: 0;
  }
  .map-popup img {
    border-radius: 50%;
    width: 4rem;
    height: 4rem;
    object-fit: cover;
  }
  .leaflet-popup-close-button {
    display: none;
  }
  .leaflet-popup .text-accent {
    color: #E9B893;
  }
  .leaflet-popup .bg-accent/10 {
    background-color: rgba(233, 184, 147, 0.1);
  }
  .leaflet-popup a:hover {
    opacity: 0.8;
  }
`;

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = popupStyles;
  document.head.appendChild(style);
}

interface MapProps {
  members: CommunityMember[];
  center: [number, number];
  zoom?: number;
  variant?: 'hero' | 'preview' | 'share' | 'download';
  settings?: MapSettings;
  onSettingsChange?: (settings: MapSettings) => void;
  className?: string;
}

export const Map: React.FC<MapProps> = ({
  members,
  center,
  zoom = 4,
  variant = 'preview',
  settings = defaultMapSettings,
  onSettingsChange,
  className
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const showSettings = variant === 'hero' || variant === 'preview';
  const { features, style, customization } = settings;
  const [searchValue, setSearchValue] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Get the current map style configuration
  const currentMapStyle = mapStyles[style.id] || mapStyles.standard;

  const handleSearch = async (value: string) => {
    try {
      const location = await geocodeLocation(value);
      if (location.latitude && location.longitude && mapRef.current) {
        mapRef.current.setView(
          [parseFloat(location.latitude), parseFloat(location.longitude)],
          12
        );
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById('map-container')?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="relative w-full h-full" id="map-container">
      {/* Map Base Layer */}
      <div className="absolute inset-0">
        <MapContainer
          ref={mapRef}
          center={center}
          zoom={zoom}
          className="w-full h-full"
          zoomControl={false}
          minZoom={2}
          maxZoom={18}
          scrollWheelZoom={true}
          preferCanvas={true}
        >
          <ZoomControl position="bottomright" />
          
          <TileLayer
            attribution={currentMapStyle.attribution}
            url={currentMapStyle.url}
            maxZoom={18}
            subdomains={['a', 'b', 'c']}
            keepBuffer={8}
          />
          
          {features.enableClustering ? (
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={50}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              iconCreateFunction={(cluster: { getChildCount: () => any; }) => {
                const childCount = cluster.getChildCount();
                const size = childCount < 10 ? 'small' : childCount < 100 ? 'medium' : 'large';
                return L.divIcon({
                  html: `<div style="background-color: ${customization.clusterColor}"><span>${childCount}</span></div>`,
                  className: `marker-cluster marker-cluster-${size}`,
                  iconSize: L.point(40, 40)
                });
              }}
            >
              {members.map((member) => (
                <MapMarker
                  key={member.id}
                  member={member}
                  settings={settings}
                />
              ))}
            </MarkerClusterGroup>
          ) : (
            members.map((member) => (
              <MapMarker
                key={member.id}
                member={member}
                settings={settings}
              />
            ))
          )}
        </MapContainer>
      </div>

      {/* Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_INDEX.MAP_CONTROLS }}>
        {/* Top Left Controls */}
        {(features.enableSharing || features.enableFullscreen) && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto" style={{ zIndex: Z_INDEX.MAP_BUTTONS }}>
            {features.enableSharing && (
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            {features.enableFullscreen && (
              <button
                onClick={toggleFullScreen}
                className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-gray-600"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Top Center Search */}
        {features.enableSearch && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4 pointer-events-auto" style={{ zIndex: Z_INDEX.MAP_SEARCH }}>
            <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-shadow p-2 px-4 flex items-center gap-2 min-w-[300px]">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="text-gray-500"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search location..."
                className="border-none outline-none bg-transparent text-gray-700 text-sm w-full"
              />
            </div>
          </div>
        )}

        {/* Top Right Settings */}
        {showSettings && onSettingsChange && (
          <div className="absolute top-4 right-4 pointer-events-auto" style={{ zIndex: Z_INDEX.MAP_BUTTONS }}>
            <MapSettingsWidget
              settings={settings}
              onSettingsChange={onSettingsChange}
            />
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        mapId={variant === 'preview' ? 'demo' : 'custom'}
      />
    </div>
  );
};
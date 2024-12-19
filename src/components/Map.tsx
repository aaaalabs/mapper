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
import { updateMapName } from '../services/mapService';
import { supabase } from '../lib/supabase';
import { useMapTiles } from '../hooks/useMapTiles';
import { useToast } from '../components/ui/toast';

// Fix Leaflet default marker icon paths
L.Icon.Default.mergeOptions({
  iconUrl: '/images/leaflet/marker-icon.png',
  iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
  shadowUrl: '/images/leaflet/marker-shadow.png',
});

/**
 * Custom styles for Leaflet popups to match our application theme
 */
const popupStyles = `
  .leaflet-popup-content-wrapper {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`;

/**
 * Props for the Map component
 * @interface MapProps
 */
interface MapProps {
  /** Array of community members to display on the map */
  members: CommunityMember[];
  /** Initial center coordinates [latitude, longitude] */
  center: [number, number];
  /** Initial zoom level (default: 2) */
  zoom?: number;
  /** Map variant for different use cases */
  variant?: 'hero' | 'preview' | 'share' | 'download';
  /** Map settings configuration */
  settings?: MapSettings;
  /** Callback for settings changes */
  onSettingsChange?: (settings: MapSettings) => void;
  /** Additional className for styling */
  className?: string;
  /** Unique identifier for the map */
  mapId?: string;
  /** Name of the map */
  name?: string;
  /** Callback for name changes */
  onNameChange?: (name: string) => Promise<void>;
}

/**
 * Interactive map component with clustering, custom markers, and configurable settings
 * 
 * @component
 * @example
 * ```tsx
 * <Map
 *   members={communityMembers}
 *   center={[51.505, -0.09]}
 *   zoom={13}
 *   variant="preview"
 *   settings={mapSettings}
 *   onSettingsChange={handleSettingsChange}
 * />
 * ```
 * 
 * @performance
 * - Uses marker clustering for large datasets
 * - Implements proper cleanup in useEffect
 * - Caches map tiles for better performance
 * 
 * @accessibility
 * - Supports keyboard navigation
 * - Provides ARIA labels for interactive elements
 * 
 * @see {@link MapMarker} for individual marker implementation
 * @see {@link MapSettingsWidget} for settings configuration
 */
export const Map: React.FC<MapProps> = ({
  members,
  center,
  zoom = 2,
  variant = 'preview',
  settings = defaultMapSettings,
  onSettingsChange,
  className,
  mapId,
  name = 'My Map',
  onNameChange
}) => {
  /**
   * Reference to the Leaflet map instance
   */
  const mapRef = useRef<L.Map | null>(null);

  /**
   * State for the share modal
   */
  const [showShareModal, setShowShareModal] = useState(false);

  /**
   * State for the search input
   */
  const [searchValue, setSearchValue] = useState('');

  /**
   * State for settings visibility
   */
  const [showSettings, setShowSettings] = useState(variant === 'preview' || variant === 'hero');

  /**
   * Only show name settings for preview variant
   */
  const showNameSettings = variant === 'preview';

  /**
   * Timeout reference for debouncing search input
   */
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Toast notification hook
   */
  const { addToast } = useToast();

  /**
   * Map tiles hook
   */
  const { } = useMapTiles({
    onError: (error) => {
      addToast({
        title: 'Map Loading Issue',
        description: 'There was a problem loading some map tiles. The map may appear incomplete.',
        variant: 'destructive',
      });
    },
  });

  /**
   * Get the current map style configuration
   */
  const currentMapStyle = mapStyles[settings.style.id] || mapStyles.standard;

  /**
   * Handle search input change
   * @param e
   */
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

  /**
   * Handle search input submission
   * @param value
   */
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

  /**
   * Toggle full screen mode
   */
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.getElementById('map-container')?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  /**
   * Effect for subscribing to real-time map updates
   */
  useEffect(() => {
    if (mapId && mapId !== 'demo') {
      // Subscribe to real-time changes for this map
      const subscription = supabase
        .channel(`map:${mapId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'maps',
            filter: `id=eq.${mapId}`
          },
          (payload) => {
            // Update the map name if it changed
            if (payload.new.name !== name) {
              onNameChange?.(payload.new.name);
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [mapId, name]);

  /**
   * Handle map name change
   * @param newName
   */
  const handleNameChange = async (newName: string) => {
    if (onNameChange) {
      try {
        await onNameChange(newName);
      } catch (error) {
        console.error('Failed to update map name:', error);
        // You might want to show a toast notification here
      }
    }
  };

  return (
    <div className={cn("relative w-full h-full", className)} id="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        ref={mapRef}
        className={cn(
          'w-full h-full rounded-lg',
          variant === 'hero' && 'rounded-none',
          className
        )}
        attributionControl={false}
        zoomControl={false}
        minZoom={2}
        maxZoom={18}
      >
        <ZoomControl position="bottomright" />
        
        <TileLayer
          url={currentMapStyle.url}
          attribution={currentMapStyle.attribution}
          maxZoom={18}
          subdomains={['a', 'b', 'c']}
          keepBuffer={8}
          eventHandlers={{
            tileerror: (error) => {
              console.error('Tile loading error:', error);
            },
          }}
          errorTileUrl="/images/error-tile.png"
        />
        
        {settings.features.enableClustering ? (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            iconCreateFunction={(cluster: { getChildCount: () => any; }) => {
              const childCount = cluster.getChildCount();
              const size = childCount < 10 ? 'small' : childCount < 100 ? 'medium' : 'large';
              return L.divIcon({
                html: `<div style="background-color: ${settings.customization.clusterColor}"><span>${childCount}</span></div>`,
                className: `marker-cluster marker-cluster-${size}`,
                iconSize: L.point(40, 40)
              });
            }}
          >
            {members.map((member, index) => (
              <MapMarker
                key={`${member.name}-${index}`}
                member={member}
                settings={settings}
                showName={settings.customization.showName}
                mapId={mapId}
              />
            ))}
          </MarkerClusterGroup>
        ) : (
          members.map((member, index) => (
            <MapMarker
              key={`${member.name}-${index}`}
              member={member}
              settings={settings}
              showName={settings.customization.showName}
              mapId={mapId}
            />
          ))
        )}
        
        {settings.customization.showName && name && (variant === 'preview' || variant === 'share' || variant === 'download') && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center pointer-events-none" style={{ zIndex: Z_INDEX.MAP_SETTINGS }}>
            <div className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-100">
              <span className="text-sm font-medium text-gray-800">{name}</span>
            </div>
          </div>
        )}
      </MapContainer>

      {/* Controls Overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: Z_INDEX.MAP_CONTROLS }}>
        {/* Top Left Controls */}
        {(settings.features.enableSharing || settings.features.enableFullscreen) && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto" style={{ zIndex: Z_INDEX.MAP_BUTTONS }}>
            {settings.features.enableSharing && (variant === 'preview' || variant === 'share') && (
              <button
                onClick={() => setShowShareModal(true)}
                className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            {settings.features.enableFullscreen && (
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
        {settings.features.enableSearch && (
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
              name={showNameSettings ? name : undefined}
              onNameChange={showNameSettings ? onNameChange : undefined}
              variant={variant === 'hero' || variant === 'preview' ? variant : undefined}
              mapId={mapId}
              defaultExpanded={variant === 'preview'}
            />
          </div>
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        mapId={mapId || 'demo'}
      />
    </div>
  );
};
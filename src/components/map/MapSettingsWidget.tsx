import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Settings2, ChevronDown, ChevronUp, RefreshCw, AlertCircle } from 'lucide-react';
import { MapSettings } from '../../types/mapSettings';
import { Z_INDEX } from '../../constants/zIndex';
import { cn } from '../../utils/cn';
import { updateMapName, updateMapSettings } from '../../services/mapService';
import { supabase } from '../../config/supabase';

interface MapSettingsWidgetProps {
  settings: MapSettings;
  onSettingsChange: (settings: MapSettings) => void;
  name?: string;
  onNameChange?: (name: string) => Promise<void>;
  variant?: 'preview' | 'hero';
  className?: string;
  mapId?: string;
  defaultExpanded?: boolean;
}

export const MapSettingsWidget: React.FC<MapSettingsWidgetProps> = ({
  settings,
  onSettingsChange,
  name,
  onNameChange,
  variant = 'preview',
  className,
  mapId,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  const handleSettingsChange = (newSettings: Partial<MapSettings>) => {
    const updatedSettings = {
      ...settings,
      ...newSettings
    };
    onSettingsChange(updatedSettings);
    
    // Sync settings with Supabase
    if (mapId) {
      setIsSyncing(true);
      setIsSynced(false);
      setSyncError(null);
      
      // Clear any existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Update settings in Supabase after a short debounce
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await updateMapSettings(mapId, updatedSettings);
          setIsSynced(true);
        } catch (error) {
          setSyncError('Failed to sync settings');
          console.error('Error syncing settings:', error);
        } finally {
          setIsSyncing(false);
          // Clear sync status after 2 seconds
          setTimeout(() => {
            setIsSynced(false);
            setSyncError(null);
          }, 2000);
        }
      }, 500); // 500ms debounce
    }
  };

  const syncNameToSupabase = async (newName: string) => {
    if (!mapId) return;
    
    setIsSyncing(true);
    setIsSynced(false);
    setSyncError(null);
    try {
      await updateMapName(mapId, newName);
      setIsSynced(true);
    } catch (error: any) {
      console.error('Failed to sync map name:', error);
      setSyncError(error.message || 'Failed to sync map name');
      // Show error state for 3 seconds
      setTimeout(() => setSyncError(null), 3000);
    } finally {
      setIsSyncing(false);
      // Reset synced status after 2 seconds
      if (!syncError) {
        setTimeout(() => setIsSynced(false), 2000);
      }
    }
  };

  const handleNameChange = async (newName: string) => {
    try {
      if (onNameChange) {
        await onNameChange(newName);
      }
      
      // Clear any existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Set new timeout to sync after 500ms of no changes
      syncTimeoutRef.current = setTimeout(() => {
        syncNameToSupabase(newName);
      }, 500);
    } catch (error) {
      console.error('Failed to update map name:', error);
      setSyncError('Failed to update map name');
      setTimeout(() => setSyncError(null), 3000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mapId) {
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
          async (payload) => {
            // Update the map name if it changed and it's different from our current value
            if (payload.new.name && payload.new.name !== name) {
              try {
                if (onNameChange) {
                  await onNameChange(payload.new.name);
                }
              } catch (error) {
                console.error('Failed to update map name from real-time update:', error);
              }
            }
          }
        )
        .subscribe();

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [mapId, name, onNameChange]);

  // Render map name settings only in preview mode
  const renderMapNameSettings = () => {
    if (variant !== 'preview') return null;
    
    return (
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700">Map Name</h3>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.customization.showName}
            onChange={(e) =>
              handleSettingsChange({
                customization: {
                  ...settings.customization,
                  showName: e.target.checked
                }
              })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            id="show-map-name"
          />
          <div className="relative flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter map name"
              className={cn(
                "w-full px-3 py-1.5 border rounded-md text-sm pr-8",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                !settings.customization.showName && "text-gray-400 bg-gray-50",
                syncError && "border-red-500 focus:ring-red-500"
              )}
            />
            {mapId && (
              <div 
                className={cn(
                  "absolute right-2.5 top-1/2 -translate-y-1/2",
                  "transition-all duration-300",
                  isSyncing && "animate-spin text-blue-500",
                  isSynced && "text-green-500",
                  syncError && "text-red-500",
                  !isSyncing && !isSynced && !syncError && "text-gray-400"
                )}
                title={syncError || undefined}
              >
                {syncError ? <AlertCircle size={14} /> : <RefreshCw size={14} />}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
      >
        <Settings2 className="w-5 h-5 text-gray-600" />
      </button>

      {isExpanded && (
        <div className="absolute top-12 right-0 w-[325px] bg-white rounded-lg shadow-lg p-4" style={{ zIndex: Z_INDEX.MAP_SETTINGS }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Map Settings</h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Map Name Settings - Only in preview mode */}
            {renderMapNameSettings()}

            {/* Features Section - Always visible */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Features</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.features.enableClustering}
                    onChange={() => handleSettingsChange({
                      features: {
                        ...settings.features,
                        enableClustering: !settings.features.enableClustering
                      }
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Clustering</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.features.enableFullscreen}
                    onChange={() => handleSettingsChange({
                      features: {
                        ...settings.features,
                        enableFullscreen: !settings.features.enableFullscreen
                      }
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Fullscreen</span>
                </label>
                {variant === 'preview' && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.features.enableSharing}
                      onChange={() => handleSettingsChange({
                        features: {
                          ...settings.features,
                          enableSharing: !settings.features.enableSharing
                        }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">Share</span>
                  </label>
                )}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.features.enableSearch}
                    onChange={() => handleSettingsChange({
                      features: {
                        ...settings.features,
                        enableSearch: !settings.features.enableSearch
                      }
                    })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600">Search</span>
                </label>
              </div>
            </div>

            {/* Combined Style Section */}
            <div className="grid grid-cols-2 gap-3">
              <select
                value={settings.style.id}
                onChange={(e) => handleSettingsChange({
                  style: {
                    ...settings.style,
                    id: e.target.value
                  }
                })}
                className="px-3 py-1.5 border rounded-md text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="minimal">Minimal</option>
                <option value="dark">Dark</option>
                <option value="satellite">Satellite</option>
              </select>
              <select
                value={settings.style.markerStyle}
                onChange={(e) => handleSettingsChange({
                  style: {
                    ...settings.style,
                    markerStyle: e.target.value as MapSettings['style']['markerStyle']
                  }
                })}
                className="px-3 py-1.5 border rounded-md text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pins">Standard Pins</option>
                <option value="photos">Photo Markers</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

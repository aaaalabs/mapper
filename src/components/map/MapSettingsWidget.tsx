import React, { useState } from 'react';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { MapSettings } from '../../types/mapSettings';
import { Z_INDEX } from '../../constants/zIndex';

interface MapSettingsWidgetProps {
  settings: MapSettings;
  onSettingsChange: (settings: MapSettings) => void;
  className?: string;
  variant?: string;
}

export const MapSettingsWidget: React.FC<MapSettingsWidgetProps> = ({
  settings,
  onSettingsChange,
  className,
  variant,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFeatureToggle = (featureKey: keyof MapSettings['features']) => {
    onSettingsChange({
      ...settings,
      features: {
        ...settings.features,
        [featureKey]: !settings.features[featureKey],
      },
    });
  };

  const handleStyleChange = (styleId: string) => {
    onSettingsChange({
      ...settings,
      style: {
        ...settings.style,
        id: styleId,
      },
    });
  };

  const handleMarkerStyleChange = (markerStyle: MapSettings['style']['markerStyle']) => {
    onSettingsChange({
      ...settings,
      style: {
        ...settings.style,
        markerStyle,
      },
    });
  };

  return (
    <div className={`absolute ${className}`} style={{ top: 0, right: 0, zIndex: Z_INDEX.MAP_SETTINGS }}>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden min-w-[240px]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100"
        >
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Map Settings</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </button>
        
        {isExpanded && (
          <div className="p-4 bg-white/95 backdrop-blur-sm">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Features</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.enableClustering}
                      onChange={() => handleFeatureToggle('enableClustering')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Enable Clustering</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.enableFullscreen}
                      onChange={() => handleFeatureToggle('enableFullscreen')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Fullscreen Button</span>
                  </label>
                  {variant !== 'hero' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.features.enableSharing}
                        onChange={() => handleFeatureToggle('enableSharing')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Share Button</span>
                    </label>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.features.enableSearch}
                      onChange={() => handleFeatureToggle('enableSearch')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Search Box</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Map Style</h3>
                <select
                  value={settings.style.id}
                  onChange={(e) => handleStyleChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="minimal">Minimal</option>
                  <option value="dark">Dark</option>
                  <option value="satellite">Satellite</option>
                </select>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Marker Style</h3>
                <select
                  value={settings.style.markerStyle}
                  onChange={(e) => handleMarkerStyleChange(e.target.value as MapSettings['style']['markerStyle'])}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pins">Standard Pins</option>
                  <option value="photos">Photo Markers</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { MapPin, Image, Search, Maximize, Share2, Grid, Lock, Download } from 'lucide-react';
import { Button } from './ui/Button';

interface MapOptionsProps {
  onChange: (options: MapOptions) => void;
  options: MapOptions;
  hasImages: boolean;
  onDownload?: () => void;
}

export interface MapOptions {
  markerStyle: 'pins' | 'photos';
  enableSearch: boolean;
  enableFullscreen: boolean;
  enableSharing: boolean;
  enableClustering: boolean;
}

export function MapOptions({ onChange, options, hasImages, onDownload }: MapOptionsProps) {
  const handleOptionChange = (key: keyof MapOptions, value: any) => {
    onChange({
      ...options,
      [key]: value
    });
  };

  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-background-white rounded-lg p-6 shadow-soft">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-primary">Map Features</h3>
        {onDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="flex items-center gap-2 text-accent hover:text-accent-alt"
          >
            <Download className="w-4 h-4" />
            Download Map
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Image className="w-4 h-4 text-accent-alt" />
            <span className="font-medium text-primary">Marker Style</span>
          </div>
          <div className="space-y-2 ml-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="markerStyle"
                value="pins"
                checked={options.markerStyle === 'pins'}
                onChange={(e) => handleOptionChange('markerStyle', e.target.value)}
                className="text-accent-alt focus:ring-accent-alt"
              />
              <span className="text-secondary">Location Pins</span>
            </label>
            <label 
              className="flex items-center gap-2 cursor-pointer opacity-50"
              onClick={scrollToPricing}
            >
              <input
                type="radio"
                name="markerStyle"
                value="photos"
                disabled
                className="text-gray-300"
              />
              <span className="flex items-center gap-2 text-gray-400">
                Member Photos
                <Lock className="w-4 h-4" />
              </span>
            </label>
          </div>
        </div>

        {[
          {
            key: 'enableClustering',
            icon: Grid,
            label: 'Marker Clustering',
            description: 'Group nearby markers together'
          },
          {
            key: 'enableFullscreen',
            icon: Maximize,
            label: 'Fullscreen Mode',
            description: 'Allow fullscreen map viewing'
          },
          {
            key: 'enableSharing',
            icon: Share2,
            label: 'Sharing Options',
            description: 'Enable map sharing features'
          }
        ].map((feature) => (
          <div key={feature.key} className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <feature.icon className="w-4 h-4 text-accent-alt" />
              <span className="font-medium text-primary">{feature.label}</span>
            </div>
            <label className="flex items-center gap-2 ml-6">
              <input
                type="checkbox"
                checked={options[feature.key as keyof MapOptions] as boolean}
                onChange={(e) => handleOptionChange(feature.key, e.target.checked)}
                className="rounded border-tertiary/30 text-accent-alt focus:ring-accent-alt"
              />
              <span className="text-secondary">{feature.description}</span>
            </label>
          </div>
        ))}

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-accent-alt" />
            <span className="font-medium text-gray-400 flex items-center gap-2">
              Search Members
              <Lock className="w-4 h-4" />
            </span>
          </div>
          <label 
            className="flex items-center gap-2 ml-6 cursor-pointer"
            onClick={scrollToPricing}
          >
            <input
              type="checkbox"
              disabled
              className="rounded border-gray-300 text-gray-300 cursor-not-allowed"
            />
            <span className="text-gray-400">Enable member search functionality</span>
          </label>
        </div>
      </div>
    </div>
  );
}
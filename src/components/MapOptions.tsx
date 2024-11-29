import React from 'react';
import { MapPin, Image, Search, Maximize, Share2, Grid, Lock } from 'lucide-react';

interface MapOptionsProps {
  onChange: (options: MapOptions) => void;
  options: MapOptions;
  hasImages: boolean;
}

export interface MapOptions {
  markerStyle: 'pins' | 'photos';
  enableSearch: boolean;
  enableFullscreen: boolean;
  enableSharing: boolean;
  enableClustering: boolean;
}

export function MapOptions({ onChange, options, hasImages }: MapOptionsProps) {
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

  const features = [
    {
      key: 'markerStyle',
      label: 'Marker Style',
      icon: Image,
      type: 'radio',
      options: [
        { value: 'pins', label: 'Location Pins' },
        { 
          value: 'photos', 
          label: (
            <div className="flex items-center gap-2">
              Member Photos
              <Lock className="w-4 h-4 text-amber-500" />
            </div>
          ), 
          disabled: true,
          premium: true
        }
      ],
      description: 'Choose how members are displayed on the map'
    },
    {
      key: 'enableClustering',
      label: 'Marker Clustering',
      icon: Grid,
      type: 'checkbox',
      description: 'Group nearby markers together'
    },
    {
      key: 'enableSearch',
      label: (
        <button
          onClick={scrollToPricing}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          Search Members
          <Lock className="w-4 h-4" />
        </button>
      ),
      icon: Search,
      type: 'checkbox',
      disabled: true,
      premium: true,
      description: 'Enable member search functionality'
    },
    {
      key: 'enableFullscreen',
      label: 'Fullscreen Mode',
      icon: Maximize,
      type: 'checkbox',
      description: 'Allow fullscreen map viewing'
    },
    {
      key: 'enableSharing',
      label: 'Sharing Options',
      icon: Share2,
      type: 'checkbox',
      description: 'Enable map sharing features'
    }
  ];

  return (
    <div className="bg-background-white rounded-lg p-6 shadow-soft">
      <h3 className="text-lg font-semibold text-primary mb-4">Map Features</h3>
      <div className="space-y-6">
        {features.map((feature) => (
          <div key={feature.key} className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <feature.icon className="w-4 h-4 text-accent-alt" />
              <span className={`font-medium ${feature.premium ? 'text-gray-400' : 'text-primary'}`}>
                {feature.label}
              </span>
            </div>
            {feature.type === 'radio' ? (
              <div className="space-y-2 ml-6">
                {feature.options.map((option) => (
                  <label 
                    key={option.value} 
                    className={`flex items-center gap-2 ${option.premium ? 'cursor-pointer' : ''}`}
                    onClick={option.premium ? scrollToPricing : undefined}
                  >
                    <input
                      type="radio"
                      name={feature.key}
                      value={option.value}
                      checked={options[feature.key as keyof MapOptions] === option.value}
                      onChange={(e) => handleOptionChange(feature.key as keyof MapOptions, e.target.value)}
                      disabled={option.disabled}
                      className="text-accent-alt focus:ring-accent-alt"
                    />
                    <span className={`${option.disabled ? 'text-gray-400' : 'text-secondary'}`}>
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <label 
                className={`flex items-center gap-2 ml-6 ${feature.premium ? 'cursor-pointer' : ''}`}
                onClick={feature.premium ? scrollToPricing : undefined}
              >
                <input
                  type="checkbox"
                  checked={options[feature.key as keyof MapOptions] as boolean}
                  onChange={(e) => handleOptionChange(feature.key as keyof MapOptions, e.target.checked)}
                  disabled={feature.disabled}
                  className="rounded border-tertiary/30 text-accent-alt focus:ring-accent-alt"
                />
                <span className={`${feature.premium ? 'text-gray-400' : 'text-secondary'}`}>
                  {feature.description}
                </span>
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
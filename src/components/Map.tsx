import React from 'react';
import { Globe } from 'lucide-react';

interface MapProps {
  isLoading?: boolean;
  mapHtml?: string;
}

export function Map({ isLoading, mapHtml }: MapProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Globe className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Generating your community map...</p>
        </div>
      </div>
    );
  }

  if (!mapHtml) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Upload a CSV to generate your map</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-96 rounded-lg overflow-hidden border border-gray-200 bg-white"
      dangerouslySetInnerHTML={{ __html: mapHtml }}
    />
  );
}
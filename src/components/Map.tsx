import React from 'react';
import { Globe } from 'lucide-react';
import { CommunityMap } from './CommunityMap';
import { CommunityMember } from '../types';

interface MapProps {
  isLoading?: boolean;
  mapHtml?: string;
  members?: CommunityMember[];
  center?: [number, number];
}

export function Map({ isLoading, mapHtml, members, center }: MapProps) {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <Globe className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Generating your community map...</p>
        </div>
      </div>
    );
  }

  if (!mapHtml && (!members || !center)) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Upload a CSV to generate your map</p>
        </div>
      </div>
    );
  }

  if (members && center) {
    return (
      <div className="h-full rounded-lg overflow-hidden border border-gray-200 bg-white">
        <CommunityMap
          members={members}
          center={center}
          options={{
            markerStyle: 'pins',
            enableSearch: false,
            enableFullscreen: true,
            enableSharing: false,
            enableClustering: true
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className="h-full rounded-lg overflow-hidden border border-gray-200 bg-white"
      dangerouslySetInnerHTML={{ __html: mapHtml || '' }}
    />
  );
}
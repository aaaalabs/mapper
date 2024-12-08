import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Map } from '../components/Map';
import { getMap } from '../services/mapService';
import { SavedMap } from '../services/mapService';
import { Logo } from '../components/ui/Logo';

export function EmbedMap() {
  const { id } = useParams<{ id: string }>();
  const [mapData, setMapData] = useState<SavedMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMap() {
      if (!id) {
        setError('No map ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getMap(id);
        setMapData(data);
      } catch (err) {
        setError('Failed to load map');
        console.error('Error loading map:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMap();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-medium">{error || 'Map not found'}</p>
      </div>
    );
  }

  return (
    <div className="h-screen relative">
      <Map
        members={mapData.members}
        center={mapData.center}
        zoom={mapData.zoom}
        hideShareButton={true}
      />
      
      {/* VoiceLoop Branding */}
      <a
        href="https://mapper.voiceloop.io"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm hover:bg-white transition-colors duration-200 group"
      >
        <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
          <Logo className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-500 group-hover:text-gray-900">
          Powered by VoiceLoop
        </span>
      </a>
    </div>
  );
} 
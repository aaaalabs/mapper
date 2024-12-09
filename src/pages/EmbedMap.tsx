import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Map } from '../components/Map';
import { getMap } from '../services/mapService';
import { SavedMap } from '../services/mapService';
import { AttributionBadge } from '../components/AttributionBadge';
import './EmbedMap.css';

export function EmbedMap() {
  const { id } = useParams<{ id: string }>();
  const [mapData, setMapData] = useState<SavedMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Remove any scrollbars and margins
  useEffect(() => {
    // Remove all styles that might interfere with full-screen display
    document.documentElement.style.height = '100%';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.body.style.height = '100%';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.height = '';
      document.documentElement.style.margin = '';
      document.documentElement.style.padding = '';
      document.body.style.height = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    document.body.classList.add('embed-page');
    return () => {
      document.body.classList.remove('embed-page');
    };
  }, []);

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
      <div className="embed-container">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="embed-container">
        <p className="text-red-600 font-medium">{error || 'Map not found'}</p>
      </div>
    );
  }

  return (
    <div className="embed-root">
      <Map
        members={mapData.members}
        center={mapData.center}
        zoom={mapData.zoom}
        hideShareButton
        className="embed-map"
      />
      <AttributionBadge />
    </div>
  );
}
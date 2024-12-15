import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Map } from '../components/Map';
import { getMap } from '../services/mapService';
import { SavedMap } from '../services/mapService';
import { AttributionBadge } from '../components/AttributionBadge';
import './SharedMap.css';

export function SharedMap() {
  const { id } = useParams<{ id: string }>();
  const [mapData, setMapData] = useState<SavedMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    document.body.classList.add('shared-page');
    return () => {
      document.body.classList.remove('shared-page');
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
        setShowName(data.show_name || false);
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
      <div className="shared-container">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="shared-container">
        <p className="text-red-600 font-medium">{error || 'Map not found'}</p>
      </div>
    );
  }

  return (
    <div className="shared-root">
      <Map
        members={mapData.members}
        center={mapData.center}
        zoom={mapData.zoom}
        className="shared-map"
        mapId={id}
        name={mapData.name}
        settings={mapData.settings}
        variant="share"
        showName={showName}
      />
      <AttributionBadge />
    </div>
  );
}
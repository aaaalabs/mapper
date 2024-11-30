import { useState, useEffect } from 'react';
import { initializeMap } from '../utils/mapInitializer';
import { MapStyle } from '../types/map';

interface UseMapInitializerProps {
  currentZoom: number;
  mapPurpose: 'community' | 'navigation' | 'analytics';
  minZoom?: number;
  maxZoom?: number;
}

export function useMapInitializer({
  currentZoom,
  mapPurpose,
  minZoom = 2,
  maxZoom = 18
}: UseMapInitializerProps) {
  const [mapStyle, setMapStyle] = useState<MapStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get viewport dimensions
        const viewportSize = {
          width: window.innerWidth,
          height: window.innerHeight
        };

        const { style, metrics } = initializeMap({
          currentZoom,
          viewportSize,
          mapPurpose,
          minZoom,
          maxZoom
        });

        // Simulate style loading delay based on metrics
        await new Promise(resolve => setTimeout(resolve, Math.min(metrics.loadTime, 2000)));

        setMapStyle(style);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize map');
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, [currentZoom, mapPurpose, minZoom, maxZoom]);

  return { mapStyle, isLoading, error };
}
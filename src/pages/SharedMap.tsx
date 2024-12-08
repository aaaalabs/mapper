import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Map } from '../components/Map';
import { getMap, MapError } from '../services/mapService';
import { SavedMap } from '../services/mapService';
import { Globe } from 'lucide-react';
import { ShareModal } from '../components/ShareModal';
import { Overlay } from '../components/ui/Overlay';

export function SharedMap() {
  const { id } = useParams<{ id: string }>();
  const [mapData, setMapData] = useState<SavedMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMap() {
      if (!id) {
        setError('Invalid map link. Please check the URL and try again.');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getMap(id);
        setMapData(data);
      } catch (err) {
        if (err instanceof MapError) {
          if (err.code === 'NOT_FOUND') {
            setError('This map could not be found. It may have been deleted or the link might be incorrect.');
          } else {
            setError(err.message);
          }
        } else {
          setError('Unable to load the map. Please try again later.');
        }
        console.error('Error loading map:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadMap();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Globe className="w-12 h-12 text-accent animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <Globe className="w-12 h-12 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Oops!</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <a 
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Return Home
          </a>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Map not found</p>
          <a href="/" className="text-accent hover:text-accent-dark mt-4 block">
            Return to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h1 className="text-xl font-semibold mb-4">{mapData.name}</h1>
          <div className="h-[600px]">
            <Map
              ref={mapRef}
              members={mapData.members}
              center={mapData.center}
              zoom={mapData.zoom}
              onShare={() => setShowShare(true)}
            />
          </div>
        </div>
      </div>

      <Overlay isOpen={showShare} onClose={() => setShowShare(false)}>
        <ShareModal
          mapId={id!}
          mapRef={mapRef}
          onClose={() => setShowShare(false)}
        />
      </Overlay>
    </div>
  );
} 
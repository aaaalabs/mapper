import { useEffect, useState } from 'react';

interface UseMapTilesOptions {
  onError?: (error: Error) => void;
}

export function useMapTiles(options: UseMapTilesOptions = {}) {
  const [isServiceWorkerReady, setServiceWorkerReady] = useState(false);
  const [tileLoadErrors, setTileLoadErrors] = useState(0);
  
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/mapTileWorker.js')
        .then(() => {
          setServiceWorkerReady(true);
        })
        .catch((error) => {
          console.error('ServiceWorker registration failed:', error);
          options.onError?.(new Error('Failed to initialize tile caching'));
        });
    }

    // Monitor tile loading errors
    const handleTileError = (event: ErrorEvent) => {
      if (event.filename?.includes('/tiles/')) {
        setTileLoadErrors(prev => {
          const newCount = prev + 1;
          // If we hit too many errors, notify the application
          if (newCount > 10) {
            options.onError?.(new Error('Multiple tile loading failures detected'));
          }
          return newCount;
        });
      }
    };

    window.addEventListener('error', handleTileError);
    
    return () => {
      window.removeEventListener('error', handleTileError);
    };
  }, [options.onError]);

  return {
    isServiceWorkerReady,
    tileLoadErrors,
  };
}

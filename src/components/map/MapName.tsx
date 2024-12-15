import React from 'react';
import { cn } from '../../lib/utils';
import { Z_INDEX } from '../../constants/zIndex';

interface MapNameProps {
  className?: string;
}

export function MapName({ className }: MapNameProps) {
  const map = useMap();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!map) return;
    
    // Get map name from map settings or state
    const mapName = map.getContainer().getAttribute('data-map-name');
    setName(mapName);
  }, [map]);

  if (!name) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2",
        "bg-white/90 backdrop-blur-sm rounded-lg shadow-md",
        "px-4 py-2 text-sm font-medium text-gray-700",
        "dark:bg-gray-800/90 dark:text-gray-200",
        "sm:mb-0",
        className
      )}
      style={{ zIndex: Z_INDEX.MAP_ATTRIBUTION }}
    >
      {name}
    </div>
  );
}

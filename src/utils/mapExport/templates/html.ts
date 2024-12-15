import { CommunityMember } from '../../../types';
import { MapSettings, defaultMapSettings } from '../../../types/mapSettings';
import { generateStyles } from './styles';
import { generateSearchHtml, generateSearchScript } from './components/search';
import { generateMapScript, generateMemberPopup } from './components/map';

export interface MapOptions extends Partial<MapSettings> {}

const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/'/g, '\\u0027')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  } catch (error) {
    console.error('Error stringifying object:', error);
    return '{}';
  }
};

export async function generateHtml(
  members: CommunityMember[],
  center: [number, number],
  options: MapOptions = {}
): Promise<string> {
  const settings: MapSettings = {
    ...defaultMapSettings,
    style: {
      ...defaultMapSettings.style,
      markerStyle: 'photos',  // Use photos as default for preview
      popupStyle: {
        ...defaultMapSettings.style.popupStyle
      }
    },
    features: {
      ...defaultMapSettings.features,
      enableSearch: true,  // Enable search by default
      enableClustering: true
    },
    customization: {
      ...defaultMapSettings.customization,
      showName: false  // Always disable map name in exported maps
    },
    ...options
  };

  // Cache for storing base64 encoded images
  const imageCache = new Map<string, string>();

  // Function to cache an image
  async function cacheImage(url: string): Promise<string> {
    if (!url) return '';
    if (imageCache.has(url)) return imageCache.get(url)!;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      imageCache.set(url, base64);
      return base64;
    } catch (error) {
      console.error('Failed to cache image:', error);
      return '';
    }
  }

  // Default avatar SVG as fallback
  const defaultAvatar = '/images/default-avatar.svg';
  const defaultMarker = '/images/leaflet/marker-icon.png';

  // Cache default images
  await cacheImage(defaultAvatar);
  await cacheImage(defaultMarker);

  // Cache member images
  await Promise.all(
    members
      .filter(member => member.image)
      .map(member => cacheImage(member.image || ''))
  );

  const defaultAvatarUrl = 'https://via.placeholder.com/40';

  // Prepare client-side data
  const clientMembers = members.map(member => ({
    id: member.id,
    name: member.name || '',
    title: member.title || '',
    latitude: member.latitude,
    longitude: member.longitude,
    location: member.location || '',
    description: member.description || '',
    image: member.image || defaultAvatar,
    website: member.website || '',
    linkedin: member.linkedin || '',
    links: member.links || {}
  }));

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Map</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
    ${settings.features?.enableFullscreen ? `
    <link rel="stylesheet" href="https://unpkg.com/leaflet.fullscreen@latest/Control.FullScreen.css" />
    ` : ''}
    <style>${generateStyles()}</style>
</head>
<body>
    <div id="map"></div>
    ${settings.features?.enableSearch ? generateSearchHtml() : ''}
    
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
    ${settings.features?.enableFullscreen ? `
    <script src="https://unpkg.com/leaflet.fullscreen@latest/Control.FullScreen.js"></script>
    ` : ''}
    <script>
      // Initialize map data
      const members = ${safeStringify(clientMembers)};
      const mapCenter = ${safeStringify(center)};
      const settings = ${safeStringify({ ...defaultMapSettings, ...options })};
      const defaultAvatar = '${defaultAvatar}';
      
      // Initialize map
      const map = L.map('map', {
        center: mapCenter,
        zoom: settings.zoom || 3,
        zoomControl: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 18,
        fullscreenControl: settings.features?.enableFullscreen || false
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
      }).addTo(map);

      // Initialize marker cluster group
      const markers = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
      });

      // Add markers for each member
      members.forEach(member => {
        if (member.latitude && member.longitude) {
          const marker = L.marker([member.latitude, member.longitude]);
          marker.bindPopup(generateMemberPopup(member, defaultAvatar));
          markers.addLayer(marker);
        }
      });

      map.addLayer(markers);

      // Fit bounds if there are markers
      if (markers.getLayers().length > 0) {
        map.fitBounds(markers.getBounds(), {
          padding: [50, 50]
        });
      }

      // Initialize search if enabled
      ${settings.features?.enableSearch ? generateSearchScript() : ''}
    </script>
</body>
</html>`;
}

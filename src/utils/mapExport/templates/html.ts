import { CommunityMember } from '../../../types';
import { MapSettings, defaultMapSettings } from '../../../types/mapSettings';

export interface MapOptions extends Partial<MapSettings> {}

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
      ...defaultMapSettings.customization
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

  const membersJson = members.map(member => ({
    ...member,
    image: member.image ? imageCache.get(member.image) || imageCache.get(defaultAvatar) : imageCache.get(defaultAvatar)
  }));

  // Convert imageCache to a plain object for JSON serialization
  const imageCacheJson = Object.fromEntries(imageCache);

  // Create a safe JSON.stringify that handles undefined values and converts booleans to strings when needed
  const safeStringify = (obj: any) => JSON.stringify(obj, (key, value) => {
    if (value === undefined) return null;
    if (typeof value === 'boolean') return value.toString();
    return value;
  });

  return `<!DOCTYPE html>
<html>
  <head>
    <title>Community Map</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
    <style>
      body { 
        margin: 0; 
        padding: 0;
        font-family: ${settings.customization.fontFamily}, system-ui, sans-serif;
      }
      #map { 
        position: absolute; 
        top: 0; 
        bottom: 0; 
        width: 100%; 
      }
      .search-container {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
        width: 300px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .search-input {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
      }
      .search-results {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border-radius: 8px;
        margin-top: 4px;
        max-height: 200px;
        overflow-y: auto;
        display: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .search-result-item {
        padding: 8px 12px;
        cursor: pointer;
      }
      .search-result-item:hover {
        background-color: #f5f5f5;
      }
      .leaflet-popup-content-wrapper {
        padding: 0 !important;
        overflow: hidden;
        border-radius: 8px !important;
      }
      .leaflet-popup-content {
        margin: 0 !important;
      }
      .member-popup { 
        text-align: center; 
        padding: 1rem;
        background-color: ${settings.style.popupStyle.background};
        color: ${settings.style.popupStyle.text};
        min-width: 200px;
      }
      .member-popup img.member-image {
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        object-fit: cover;
        margin-bottom: 0.5rem;
      }
      .member-popup h3 { 
        margin: 0.5rem 0;
        font-size: 1.125rem;
        font-weight: 600;
      }
      .member-marker-img {
        border: 3px solid ${settings.customization.markerColor};
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      .member-marker {
        background: none !important;
        border: none !important;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    ${settings.features.enableSearch ? `
      <div class="search-container">
        <input type="text" class="search-input" placeholder="Search members...">
        <div class="search-results"></div>
      </div>
    ` : ''}
    <script>
      const members = ${safeStringify(membersJson)};
      const settings = ${safeStringify(settings)};
      const imageCache = ${safeStringify(imageCacheJson)};
      const defaultAvatar = '${defaultAvatar}';
      const defaultMarker = '${defaultMarker}';

      // Initialize map
      const map = L.map('map', {
        center: ${safeStringify(center)},
        zoom: settings.zoom || 13
      });

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Create markers with proper fallback handling
      function createMarker(member) {
        if (!member.latitude || !member.longitude) return null;
        
        const markerSize = settings?.style?.markerStyle === 'photos' ? 40 : 25;
        const markerHtml = settings?.style?.markerStyle === 'photos' 
          ? `<img src="${member.image || imageCache[defaultAvatar]}" alt="${member.name || ''}" class="member-marker-img" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
          : '';

        const markerIcon = settings?.style?.markerStyle === 'photos'
          ? L.divIcon({
              html: markerHtml,
              className: 'member-marker',
              iconSize: [markerSize, markerSize],
              iconAnchor: [markerSize/2, markerSize/2],
              popupAnchor: [0, -markerSize/2]
            })
          : L.icon({
              iconUrl: imageCache[defaultMarker],
              iconSize: [markerSize, 41],
              iconAnchor: [markerSize/2, 41],
              popupAnchor: [0, -41]
            });

        const marker = L.marker([member.latitude, member.longitude], { 
          icon: markerIcon 
        });

        const popupContent = `
          <div class="member-popup" style="
            background-color: ${settings.style.popupStyle.background};
            color: ${settings.style.popupStyle.text};
            padding: 1rem;
            border-radius: 8px;
            min-width: 200px;
            max-width: 300px;
          ">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <img 
                src="${member.image || imageCache[defaultAvatar]}" 
                alt="${member.name || ''}"
                style="width: 4rem; height: 4rem; border-radius: 50%; object-fit: cover;"
                onerror="this.src=imageCache[defaultAvatar]"
              >
              <div>
                <h3 style="
                  margin: 0;
                  font-size: 1.125rem;
                  font-weight: 600;
                  color: ${settings.style.popupStyle.text};
                ">${member.name || 'Unknown Member'}</h3>
                ${member.location ? `
                  <p style="
                    margin: 0.25rem 0 0;
                    font-size: 0.875rem;
                    opacity: 0.8;
                  ">${member.location}</p>
                ` : ''}
              </div>
            </div>
            ${member.links ? `
              <div class="member-links" style="
                margin-top: 0.75rem;
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
              ">
                ${Object.entries(member.links).map(([platform, url]) => `
                  <a 
                    href="${url}" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style="
                      color: ${settings.customization.markerColor};
                      text-decoration: none;
                      padding: 4px 8px;
                      border-radius: 4px;
                      font-size: 14px;
                      background: ${settings.customization.markerColor}1a;
                    "
                  >${platform}</a>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
        
        marker.bindPopup(popupContent);
        return marker;
      }

      // Initialize markers with clustering
      const markerCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 19,
        iconCreateFunction: function(cluster) {
          const count = cluster.getChildCount();
          const size = count < 10 ? 40 : count < 100 ? 50 : 60;
          return L.divIcon({
            html: `<div style="
              background-color: ${settings.customization.clusterColor};
              color: ${settings.style.popupStyle.text};
              width: ${size}px;
              height: ${size}px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 50%;
              font-weight: 600;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">${count}</div>`,
            className: 'marker-cluster',
            iconSize: L.point(size, size)
          });
        }
      });

      // Create and add markers
      members.forEach(member => {
        const marker = createMarker(member);
        if (marker) {
          markerCluster.addLayer(marker);
        }
      });
      
      map.addLayer(markerCluster);
      
      // Fit bounds to show all markers
      const bounds = markerCluster.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }

      // Add search functionality
      if (settings.features.enableSearch) {
        const searchInput = document.querySelector('.search-input') as HTMLInputElement;
        const searchResults = document.querySelector('.search-results') as HTMLDivElement;

        if (searchInput && searchResults) {
          searchInput.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const value = target.value.toLowerCase();
            
            if (!value) {
              searchResults.style.display = 'none';
              return;
            }
            
            const results = members.filter(member => 
              (member.name || '').toLowerCase().includes(value) ||
              (member.location || '').toLowerCase().includes(value) ||
              (member.bio || '').toLowerCase().includes(value)
            );
            
            searchResults.innerHTML = results
              .slice(0, 5)
              .map(member => `
                <div class="search-result-item" data-lat="${member.latitude}" data-lng="${member.longitude}">
                  ${member.name || 'Unknown Member'}
                  ${member.location ? ` - ${member.location}` : ''}
                </div>
              `)
              .join('');
            
            searchResults.style.display = results.length ? 'block' : 'none';
          });

          searchResults.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const item = target.closest('.search-result-item');
            if (!item) return;
            
            const lat = parseFloat(item.getAttribute('data-lat') || '0');
            const lng = parseFloat(item.getAttribute('data-lng') || '0');
            
            if (lat && lng) {
              map.setView([lat, lng], 16);
              searchResults.style.display = 'none';
              searchInput.value = '';
            }
          });
        }
      }
    </script>
  </body>
</html>
`;
}

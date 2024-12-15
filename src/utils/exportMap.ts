import { CommunityMember } from '../types';

export interface MapOptions {
  markerStyle?: 'default' | 'photos' | 'pins';
  enableClustering?: boolean;
  enableFullscreen?: boolean;
  enableSharing?: boolean;
  style?: {
    popupStyle?: {
      background?: string;
      text?: string;
      border?: string;
      shadow?: string;
    };
    markerStyle?: 'photos' | 'pins';
  };
  customization?: {
    markerColor?: string;
    clusterColor?: string;
    fontFamily?: string;
    showName?: boolean;
  };
  features?: {
    enableFullscreen?: boolean;
    enableClustering?: boolean;
    enableSharing?: boolean;
  };
}

interface ExportMapOptions {
  title?: string;
  description?: string;
  enableSearch?: boolean;
  enableFullscreen?: boolean;
  enableSharing?: boolean;
  mapSettings?: any; // MapSettings type is not defined in the provided code
}

export function generateStandaloneHtml(
  members: CommunityMember[], 
  center: [number, number],
  options: MapOptions = {}
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || 'Community Map'}</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css" />
    ${options.features?.enableFullscreen ? `
      <link rel="stylesheet" href="https://unpkg.com/leaflet.fullscreen@latest/Control.FullScreen.css" />
    ` : ''}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
          --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
        }
        
        body { 
          margin: 0; 
          padding: 0;
          font-family: var(--font-sans);
        }
        
        #map { 
          width: 100vw; 
          height: 100vh; 
        }
        
        .voiceloop-badge {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 1000;
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          font-family: var(--font-sans);
          font-size: 12px;
          color: #1D3640;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: opacity 0.2s;
        }
        
        .voiceloop-badge:hover {
          opacity: 0.9;
        }
        
        .voiceloop-badge svg {
          width: 16px;
          height: 16px;
        }
        
        .voiceloop-badge svg path {
          fill: currentColor;
        }
        
        .member-marker {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          object-fit: cover;
        }
        
        .leaflet-popup-content-wrapper {
          background-color: ${options.style?.popupStyle?.background || '#ffffff'};
          color: ${options.style?.popupStyle?.text || '#1D3640'};
          border: ${options.style?.popupStyle?.border || 'none'};
          box-shadow: ${options.style?.popupStyle?.shadow || '0 4px 6px -1px rgba(0, 0, 0, 0.1)'};
          border-radius: 8px;
          padding: 0;
        }
        
        .leaflet-popup-content {
          margin: 0;
          min-width: 200px;
          font-family: var(--font-sans);
        }
        
        .leaflet-popup-tip {
          background-color: ${options.style?.popupStyle?.background || '#ffffff'};
        }
        
        .member-popup {
          padding: 1rem;
          text-align: center;
        }
        
        .member-popup img {
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 0.5rem;
          border: 2px solid ${options.customization?.markerColor || '#E9B893'};
        }
        
        .member-popup h3 {
          margin: 0.5rem 0;
          font-size: 1.1rem;
          font-weight: 500;
          color: ${options.style?.popupStyle?.text || '#1D3640'};
          font-family: var(--font-sans);
        }
        
        .member-popup p {
          margin: 0.25rem 0;
          color: ${options.style?.popupStyle?.text || '#3D4F4F'};
          opacity: 0.8;
          font-size: 0.9rem;
          font-family: var(--font-sans);
        }
        
        .member-links {
          margin-top: 0.5rem;
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }
        
        .member-links a {
          color: ${options.customization?.markerColor || '#E9B893'};
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 4px;
          background: ${options.customization?.markerColor ? `${options.customization.markerColor}1A` : 'rgba(233, 184, 147, 0.1)'};
          transition: opacity 0.2s;
          font-family: var(--font-sans);
          font-size: 0.9rem;
        }
        
        .member-links a:hover {
          opacity: 0.8;
        }
        
        .marker-cluster {
          background-color: ${options.customization?.clusterColor || '#E9B893'};
          font-family: var(--font-sans);
        }
        
        .marker-cluster div {
          background-color: ${options.customization?.clusterColor ? `${options.customization.clusterColor}CC` : '#E9B893CC'};
          color: white;
          font-weight: 500;
        }
        
        .map-name {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 1000;
          background: white;
          padding: 8px 16px;
          border-radius: 999px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          font-family: var(--font-sans);
          font-size: 14px;
          color: #1D3640;
          pointer-events: none;
          border: 1px solid rgba(0,0,0,0.1);
          display: ${options.customization?.showName ? 'block' : 'none'};
        }
    </style>
</head>
<body>
    <div id="map"></div>
    ${options.customization?.showName ? `<div class="map-name">${options.title || 'Community Map'}</div>` : ''}
    <a href="https://voiceloop.io" target="_blank" class="voiceloop-badge">
        <svg viewBox="0 0 512 512" aria-label="VoiceLoop Logo">
          <path class="fill-current" d="M94.16,359.24c-7.86-5.9-15.27-10.89-22.04-16.65-26.16-22.28-45.88-49.37-59.62-80.86C3.14,240.26-.92,218.02,2.75,194.66c7.65-48.6,34.99-81.49,80.19-99.84,25.92-10.52,53.02-11.72,80.46-9.02,48.93,4.8,93.22,22.32,133.39,50.16,39.29,27.23,70.07,61.65,87.55,106.98,9.26,24.01,13.84,48.79,11.35,74.3-2.68,27.45-13.4,52.12-31.05,73.39-34.62,41.72-79.05,59.58-132.68,51.43-57.94-8.8-104.8-53.62-116.67-110.49-5.67-27.16-2.24-53.86,6.86-79.95,8.78-25.18,21.59-48.14,37.49-69.48,2.78-3.73,5.36-4.77,10.05-3.54,18.29,4.78,35.62,11.75,52.05,21.02,6.64,3.75,6.76,4.49,1.51,10.06-18.72,19.87-34.37,41.76-41.65,68.43-7.81,28.63-4.97,55.69,16.8,77.84,21.03,21.4,46.93,28.61,76,21.32,27.74-6.96,46-25.05,53.91-52.37,5.86-20.26,3.05-40.4-5.17-59.82-13.95-32.98-38.35-56.85-67.04-76.85-25.35-17.67-52.97-30.66-83.4-36.66-20.49-4.04-41.17-5.21-61.57,1.33-27.4,8.78-45.47,34.94-43.14,63.52,1.27,15.57,7.73,29.16,18.64,40.42,2.98,3.08,3.75,5.96,2.82,10.25-5.87,27.02-4.95,53.84,3.19,80.34.88,2.86,1.59,5.77,2.31,8.67.1.41-.22.93-.8,3.15Z"/>
          <path class="fill-current" d="M285.31,102.21c6.97-2.41,13.87-5.03,20.91-7.19,23.86-7.34,48.27-11.33,73.25-10.08,55.21,2.76,109.05,33.24,125.11,98.14,6.99,28.24,2.77,55.29-9.44,81.45-16.61,35.58-40.49,65.18-72.08,88.5-2.48,1.83-5.19,3.34-9.07,5.81.33-2.65.28-3.86.65-4.92,7.5-21.39,9.84-43.45,8.18-65.93-.55-7.42-1.9-14.81-3.39-22.12-.74-3.65-.22-6.1,2.44-8.89,12.31-12.9,19.39-28.31,19.02-46.26-.64-31.04-21.68-55.19-52.51-60.64-9.23-1.63-18.89-.72-28.34-1.26-2.07-.12-4.62-.92-6.03-2.32-18.5-18.32-39.88-32.03-64.39-40.84-1.37-.49-2.69-1.13-4.03-1.7-.09-.58-.18-1.16-.27-1.75Z"/>
        </svg>
        Powered by voiceloop.io
    </a>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
    ${options.features?.enableFullscreen ? `
      <script src="https://unpkg.com/leaflet.fullscreen@latest/Control.FullScreen.js"></script>
    ` : ''}
    <script>
        // Set up default marker icons
        const defaultIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        L.Marker.prototype.options.icon = defaultIcon;
        
        // Initialize map configuration
        const options = ${JSON.stringify(options)};
        const members = ${JSON.stringify(members)};
        const mapCenter = [${center[0]}, ${center[1]}];
        
        // Initialize map
        const map = L.map('map', {
          center: mapCenter,
          zoom: ${options.zoom || 3},
          zoomControl: false,
          attributionControl: false,
          minZoom: 2,
          maxZoom: 18,
          fullscreenControl: ${Boolean(options.features?.enableFullscreen)}
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: ''
        }).addTo(map);

        ${options.features?.enableClustering ? `
          const markerCluster = L.markerClusterGroup({
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            iconCreateFunction: function(cluster) {
              const color = '${options.customization?.clusterColor || '#E9B893'}';
              return L.divIcon({
                html: '<div style="background-color: ' + color + 'CC"><span>' + cluster.getChildCount() + '</span></div>',
                className: 'marker-cluster',
                iconSize: L.point(40, 40)
              });
            }
          });
        ` : ''}
        
        members.forEach(member => {
          const markerIcon = options.style?.markerStyle === 'photos' && member.image
            ? L.divIcon({
                html: '<img src="' + member.image.replace(/"/g, '&quot;') + '" alt="' + member.name.replace(/"/g, '&quot;') + '" class="member-marker" style="border-color: ' + (options.customization?.markerColor || '#E9B893') + '">',
                className: '',
                iconSize: [44, 44],
                iconAnchor: [22, 22],
                popupAnchor: [0, -20]
              })
            : options.style?.markerStyle === 'pins' 
            ? L.divIcon({
                html: '<div style="background-color: ' + (options.customization?.markerColor || '#E9B893') + '; width: 20px; height: 20px; border-radius: 50%;"></div>',
                className: '',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
                popupAnchor: [0, -10]
              })
            : defaultIcon;
            
          // Create popup content with proper escaping
          const imageHtml = member.image 
            ? '<img src="' + member.image.replace(/"/g, '&quot;') + '" alt="' + member.name.replace(/"/g, '&quot;') + '" style="border-color: ' + (options.customization?.markerColor || '#E9B893') + '">'
            : '';
            
          const titleHtml = member.title 
            ? '<p>' + member.title.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>'
            : '';
            
          const linksHtml = options.features?.enableSharing
            ? '<div class="member-links">' +
              (member.linkedin ? '<a href="' + member.linkedin.replace(/"/g, '&quot;') + '" target="_blank">LinkedIn</a>' : '') +
              (member.website ? '<a href="' + member.website.replace(/"/g, '&quot;') + '" target="_blank">Website</a>' : '') +
              '</div>'
            : '';

          const popupContent = 
            '<div class="member-popup" style="font-family: ' + (options.customization?.fontFamily || 'system-ui') + '">' +
            imageHtml +
            '<h3>' + (member.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</h3>' +
            '<p>' + (member.location || '').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</p>' +
            titleHtml +
            linksHtml +
            '</div>';

          const marker = L.marker([parseFloat(member.latitude), parseFloat(member.longitude)], {
            icon: markerIcon
          }).bindPopup(popupContent, {
            maxWidth: 300,
            minWidth: 200,
            autoPan: true,
            closeButton: false
          });

          ${options.features?.enableClustering ? 'markerCluster.addLayer(marker);' : 'marker.addTo(map);'}
        });

        ${options.features?.enableClustering ? `
          map.addLayer(markerCluster);
          
          // Fit bounds if there are markers
          if (markerCluster.getLayers().length > 0) {
            map.fitBounds(markerCluster.getBounds(), {
              padding: [50, 50]
            });
          }
        ` : ''}

        // Add zoom control if needed
        L.control.zoom({
          position: 'bottomright'
        }).addTo(map);
    </script>
</body>
</html>`;
}

export function downloadHtmlFile(html: string, filename: string, options: ExportMapOptions = {}) {
  options.enableSharing = false; // Force disable sharing for downloaded maps
  
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  } catch (error) {
    console.error('Failed to download map:', error);
    throw new Error('Failed to download map');
  }
}
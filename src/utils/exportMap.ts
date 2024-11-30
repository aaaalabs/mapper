import { CommunityMember } from '../types';
import { MapOptions } from '../components/MapOptions';

export function generateStandaloneHtml(
  members: CommunityMember[], 
  center: [number, number],
  options: MapOptions
): string {
  // Debug logging to verify data
  console.log('Generating map with members:', members);
  console.log('Map center:', center);
  console.log('Map options:', options);

  const clusteringCode = options.enableClustering ? `
    const markers = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      removeOutsideVisibleBounds: true,
      iconCreateFunction: function(cluster) {
        const count = cluster.getChildCount();
        let size = 'small';
        if (count > 50) size = 'large';
        else if (count > 10) size = 'medium';
        
        return L.divIcon({
          html: '<div class="cluster-icon ' + size + '">' + count + '</div>',
          className: 'custom-cluster-icon',
          iconSize: L.point(40, 40)
        });
      }
    });
  ` : '';

  // Create markers array first
  const markersCode = `
    const markersArray = [];
    ${members.map((member, index) => `
      const marker${index} = L.marker([${member.latitude}, ${member.longitude}], {
        icon: L.divIcon({
          html: \`${options.markerStyle === 'photos' && member.image
            ? `<img src="${member.image}" class="member-marker" alt="${member.name}">`
            : '<div class="default-marker"></div>'
          }\`,
          className: 'member-marker-container',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
          popupAnchor: [0, -20]
        })
      });

      marker${index}.bindPopup(\`
        <div class="member-popup">
          ${options.markerStyle === 'photos' && member.image
            ? `<img src="${member.image}" alt="${member.name}" class="member-image">`
            : ''
          }
          <h3>${member.name}</h3>
          ${member.title ? `<p class="member-title">${member.title}</p>` : ''}
          <p class="member-location">${member.location}</p>
          ${options.enableSharing ? `
            <div class="member-links">
              ${member.linkedin ? `<a href="${member.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''}
              ${member.website ? `<a href="${member.website}" target="_blank" rel="noopener noreferrer">Website</a>` : ''}
            </div>
          ` : ''}
        </div>
      \`);

      markersArray.push(marker${index});
    `).join('\n')}
  `;

  // Add markers to map based on clustering option
  const addMarkersCode = options.enableClustering
    ? `
      const markerCluster = L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false
      });
      markersArray.forEach(marker => markerCluster.addLayer(marker));
      map.addLayer(markerCluster);
    `
    : `markersArray.forEach(marker => marker.addTo(map));`;

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
    ${options.enableFullscreen ? `
      <link rel="stylesheet" href="https://unpkg.com/leaflet.fullscreen@latest/Control.FullScreen.css" />
    ` : ''}
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js"></script>
    ${options.enableFullscreen ? `
      <script src="https://unpkg.com/leaflet.fullscreen@latest/Control.FullScreen.js"></script>
    ` : ''}
    <style>
        body { margin: 0; padding: 0; }
        #map { width: 100vw; height: 100vh; }
        .member-marker-container { 
          background: none; 
          border: none;
        }
        .member-marker { 
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          background-color: #E9B893;
        }
        .default-marker {
          width: 20px;
          height: 20px;
          background: #E9B893;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .member-popup { 
          text-align: center; 
          padding: 1rem; 
          min-width: 200px; 
        }
        .member-image { 
          width: 100px; 
          height: 100px; 
          border-radius: 50%; 
          margin-bottom: 0.5rem;
          object-fit: cover;
        }
        .member-popup h3 { 
          margin: 0.5rem 0; 
          font-size: 1.1rem; 
          color: #1D3640; 
        }
        .member-title { 
          color: #3D4F4F; 
          margin: 0.25rem 0; 
          font-size: 0.9rem; 
        }
        .member-location { 
          color: #3D4F4F; 
          margin: 0.25rem 0; 
          font-size: 0.9rem; 
        }
        .member-links { 
          margin-top: 0.5rem; 
          display: flex;
          justify-content: center;
          gap: 1rem;
        }
        .member-links a { 
          color: #E9B893; 
          text-decoration: none; 
          transition: color 0.2s;
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(233, 184, 147, 0.1);
        }
        .member-links a:hover { 
          color: #F99D7C;
          background: rgba(233, 184, 147, 0.2);
        }
        .cluster-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #E9B893;
          color: white;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          font-weight: bold;
        }
        .cluster-icon.small {
          width: 30px;
          height: 30px;
          font-size: 12px;
        }
        .cluster-icon.medium {
          width: 35px;
          height: 35px;
          font-size: 14px;
        }
        .cluster-icon.large {
          width: 40px;
          height: 40px;
          font-size: 16px;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .leaflet-popup-content {
          margin: 0;
          padding: 0;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Initialize map
        const map = L.map('map', {
          fullscreenControl: ${options.enableFullscreen},
          zoomSnap: 0.5,
          zoomDelta: 0.5,
          minZoom: 2,
          maxZoom: 18
        }).setView([${center[0]}, ${center[1]}], 2);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        // Create markers
        ${markersCode}
        
        // Add markers to map
        ${addMarkersCode}
        
        // Fit bounds to show all markers
        const bounds = L.latLngBounds(markersArray.map(marker => marker.getLatLng()));
        map.fitBounds(bounds, { padding: [50, 50] });
    </script>
</body>
</html>`;
}

export function downloadHtmlFile(html: string, filename: string) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
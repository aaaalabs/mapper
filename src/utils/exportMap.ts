import { CommunityMember } from '../types';

interface MapOptions {
  markerStyle?: 'default' | 'photos';
  enableClustering?: boolean;
  enableFullscreen?: boolean;
  enableSharing?: boolean;
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
        .member-popup { 
          text-align: center; 
          padding: 1rem; 
          min-width: 200px; 
        }
        .member-popup h3 { 
          margin: 0.5rem 0; 
          font-size: 1.1rem; 
          color: #1D3640; 
        }
        .member-popup p { 
          margin: 0.25rem 0; 
          color: #3D4F4F;
          font-size: 0.9rem;
        }
        .member-marker { 
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          background-color: #E9B893;
        }
        .member-links { 
          margin-top: 0.5rem; 
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }
        .member-links a { 
          color: #E9B893; 
          text-decoration: none; 
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(233, 184, 147, 0.1);
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const map = L.map('map', {
          fullscreenControl: ${Boolean(options.enableFullscreen)},
          zoomSnap: 0.5,
          minZoom: 2,
          maxZoom: 18
        }).setView([${center[0]}, ${center[1]}], 2);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        const members = ${JSON.stringify(members)};
        ${options.enableClustering ? `
          const markerCluster = L.markerClusterGroup({
            chunkedLoading: true,
            maxClusterRadius: 50,
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false
          });
        ` : ''}
        
        members.forEach((member: CommunityMember) => {
          const marker = L.marker([parseFloat(member.latitude), parseFloat(member.longitude)])
            .bindPopup(\`
              <div class="member-popup">
                ${options.markerStyle === 'photos' && member.image ? 
                  `<img src="\${member.image}" alt="\${member.name}" class="member-marker">` : ''
                }
                <h3>\${member.name}</h3>
                <p>\${member.location}</p>
                \${member.title ? \`<p>\${member.title}</p>\` : ''}
                ${options.enableSharing ? `
                  <div class="member-links">
                    \${member.linkedin ? \`<a href="\${member.linkedin}" target="_blank">LinkedIn</a>\` : ''}
                    \${member.website ? \`<a href="\${member.website}" target="_blank">Website</a>\` : ''}
                  </div>
                ` : ''}
              </div>
            \`);
            
          ${options.enableClustering ? 
            'markerCluster.addLayer(marker);' : 
            'marker.addTo(map);'
          }
        });
        
        ${options.enableClustering ? 'map.addLayer(markerCluster);' : ''}
        
        const markers = ${options.enableClustering ? 
          'markerCluster.getLayers()' : 
          'Array.from(document.querySelectorAll(".leaflet-marker-icon")).map(el => L.marker([el.dataset.lat, el.dataset.lng]))'
        };
        
        if (markers.length > 0) {
          const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
          map.fitBounds(bounds, { padding: [50, 50] });
        }
    </script>
</body>
</html>`;
}

export function downloadHtmlFile(html: string, filename: string) {
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
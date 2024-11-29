import { CommunityMember } from '../types';
import { MapOptions } from '../components/MapOptions';

export function generateStandaloneHtml(
  members: CommunityMember[], 
  center: [number, number],
  options: MapOptions
): string {
  const markersCode = members.map(member => `
    L.marker([${member.latitude}, ${member.longitude}], {
      icon: L.divIcon({
        html: \`${options.showImages ? 
          `<img src="${member.image || 'https://via.placeholder.com/40'}" class="member-marker">` :
          '<div class="default-marker"></div>'
        }\`,
        className: 'member-marker-container'
      })
    }).addTo(map).bindPopup(\`
      <div class="member-popup">
        ${options.showImages ? 
          `<img src="${member.image || 'https://via.placeholder.com/100'}" alt="${member.name}" class="member-image">` :
          ''
        }
        <h3>${member.name}</h3>
        ${member.title ? `<p class="member-title">${member.title}</p>` : ''}
        <p class="member-location">${member.location}</p>
        <div class="member-links">
          ${member.linkedin ? `<a href="${member.linkedin}" target="_blank">LinkedIn</a>` : ''}
          ${member.website ? `<a href="${member.website}" target="_blank">Website</a>` : ''}
        </div>
      </div>
    \`);
  `).join('\n');

  const searchCode = options.enableSearch ? `
    const searchControl = L.control.search({
      position: 'topright',
      initial: false,
      marker: false,
      propertyName: 'name'
    });
    map.addControl(searchControl);
  ` : '';

  const fullscreenCode = options.enableFullscreen ? `
    L.control.fullscreen().addTo(map);
  ` : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Community Map</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    ${options.enableSearch ? `
      <link rel="stylesheet" href="https://unpkg.com/leaflet-control-search/dist/leaflet-search.min.css" />
      <script src="https://unpkg.com/leaflet-control-search/dist/leaflet-search.min.js"></script>
    ` : ''}
    ${options.enableFullscreen ? `
      <link rel="stylesheet" href="https://unpkg.com/leaflet.fullscreen@latest/Control.FullScreen.css" />
      <script src="https://unpkg.com/leaflet.fullscreen@latest/Control.FullScreen.js"></script>
    ` : ''}
    <style>
        body { margin: 0; padding: 0; }
        #map { width: 100vw; height: 100vh; }
        .member-marker-container { background: none; border: none; }
        .member-marker { 
          width: 40px; 
          height: 40px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.2); 
        }
        .default-marker {
          width: 20px;
          height: 20px;
          background: #E9B893;
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        .member-popup { text-align: center; padding: 1rem; }
        .member-image { width: 100px; height: 100px; border-radius: 50%; margin-bottom: 0.5rem; }
        .member-popup h3 { margin: 0.5rem 0; font-size: 1.1rem; color: #1D3640; }
        .member-title { color: #3D4F4F; margin: 0.25rem 0; font-size: 0.9rem; }
        .member-location { color: #3D4F4F; margin: 0.25rem 0; font-size: 0.9rem; }
        .member-links { margin-top: 0.5rem; }
        .member-links a { 
          color: #E9B893; 
          text-decoration: none; 
          margin: 0 0.5rem;
          transition: color 0.2s;
        }
        .member-links a:hover { color: #F99D7C; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        const map = L.map('map', {
          fullscreenControl: ${options.enableFullscreen}
        }).setView([${center[0]}, ${center[1]}], 2);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        
        ${markersCode}
        ${searchCode}
        ${fullscreenCode}
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
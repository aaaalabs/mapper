const mapCenter: [number, number] = [40.7128, -74.0060];
const settings = {
  zoom: 3,
  features: {
    enableFullscreen: false
  }
};
const defaultAvatar = '';

const members: { 
  latitude: number; 
  longitude: number; 
  image?: string; 
  name?: string; 
  location?: string; 
  title?: string; 
  linkedin?: string; 
  website?: string; 
  description?: string;
  links?: { [platform: string]: string };
}[] = [
  // Example member objects
  { latitude: 40.7128, longitude: -74.0060, name: "John Doe", location: "New York", title: "Developer" },
  // Add more members as needed
];

export const generateMapScript = (): string => `
  // Initialize map
  const map = L.map('map', {
    center: [${mapCenter[0]}, ${mapCenter[1]}],
    zoom: ${settings.zoom || 3},
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
  ${members.map((member, index) => `
    if (${member.latitude} && ${member.longitude}) {
      const marker = L.marker([${member.latitude}, ${member.longitude}]);
      
      const popupContent = \`
        <div class="member-popup">
          ${member.image ? `<img src="${member.image}" alt="${member.name || ''}" onerror="this.src='${defaultAvatar}'">` : ''}
          <h3>${member.name || ''}</h3>
          <p>${member.location || ''}</p>
          ${member.title ? `<p>${member.title}</p>` : ''}
          <div class="member-links">
            ${member.linkedin ? `<a href="${member.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''}
            ${member.website ? `<a href="${member.website}" target="_blank" rel="noopener noreferrer">Website</a>` : ''}
          </div>
        </div>
      \`;
      
      marker.bindPopup(popupContent);
      markers.addLayer(marker);
    }
  `).join('\n')}

  map.addLayer(markers);

  // Fit bounds if there are markers
  if (markers.getLayers().length > 0) {
    map.fitBounds(markers.getBounds(), {
      padding: [50, 50]
    });
  }
`;

export const generateMemberPopup = (member: any, defaultAvatar: string): string => {
  const escapeHtml = (str: string) => str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `
    <div class="member-popup">
      <img class="member-image" 
           src="${escapeHtml(member.image || defaultAvatar)}" 
           alt="${escapeHtml(member.name || '')}"
           onerror="this.src='${escapeHtml(defaultAvatar)}'">
      ${member.name ? `<h3 class="member-name">${escapeHtml(member.name)}</h3>` : ''}
      ${member.title ? `<p class="member-title">${escapeHtml(member.title)}</p>` : ''}
      ${member.location ? `<p class="member-location">${escapeHtml(member.location)}</p>` : ''}
      ${member.description ? `<p class="member-description">${escapeHtml(member.description)}</p>` : ''}
      <div class="member-links">
        ${member.website ? `<a href="${escapeHtml(member.website)}" target="_blank" rel="noopener noreferrer">Website</a>` : ''}
        ${member.linkedin ? `<a href="${escapeHtml(member.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a>` : ''}
        ${member.links && Object.keys(member.links).length > 0 ? 
          Object.entries(member.links)
            .map(([platform, url]) => 
              `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(platform)}</a>`
            )
            .join('') 
          : ''}
      </div>
    </div>
  `;
};

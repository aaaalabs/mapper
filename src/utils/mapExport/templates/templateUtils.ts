import { CommunityMember } from '../../../types';
import { MapSettings } from '../../../types/mapSettings';

export const escapeHtml = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generateMemberPopupHtml = (member: CommunityMember, defaultAvatar: string): string => {
  const name = escapeHtml(member.name || 'Unknown Member');
  const location = member.location ? escapeHtml(member.location) : '';
  const image = escapeHtml(member.image || defaultAvatar);
  
  return `
    <div class="member-popup">
      <img 
        src="${image}" 
        alt="${name}" 
        style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;" 
        onerror="this.src='${defaultAvatar}'"
      />
      <h3>${name}</h3>
      ${location ? `<p>${location}</p>` : ''}
      ${member.links ? `
        <div class="member-links">
          ${Object.entries(member.links)
            .map(([platform, url]) => `
              <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
                ${escapeHtml(platform)}
              </a>
            `).join('')}
        </div>
      ` : ''}
    </div>
  `;
};

export const generateMapInitScript = (
  members: CommunityMember[],
  settings: MapSettings,
  center: [number, number],
  defaultAvatar: string
): string => {
  const escapedMembers = JSON.stringify(members).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  const escapedSettings = JSON.stringify(settings).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
  
  return `
    const map = L.map('map', {
      fullscreenControl: true,
      zoomSnap: 0.5,
      minZoom: 2,
      maxZoom: 18
    }).setView([${center[0]}, ${center[1]}], 2);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const members = ${escapedMembers};
    const settings = ${escapedSettings};
    const defaultAvatar = '${defaultAvatar}';

    const markerCluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false
    });

    members.forEach(function(member) {
      if (member.latitude && member.longitude) {
        const marker = L.marker([member.latitude, member.longitude]);
        marker.bindPopup(${generateMemberPopupHtml.toString()}(member, defaultAvatar));
        markerCluster.addLayer(marker);
      }
    });

    map.addLayer(markerCluster);

    const bounds = markerCluster.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  `;
};

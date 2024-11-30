import { MapStyle } from '../types/map';

export const mapStyles: Record<string, MapStyle> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    popupStyle: {
      background: '#FFFFFF',
      text: '#1D3640',
      border: '#E2E8F0',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    popupStyle: {
      background: 'rgba(0, 0, 0, 0.8)',
      text: '#FFFFFF',
      border: '#374151',
      shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
    }
  },
  terrain: {
    id: 'terrain',
    name: 'Terrain',
    url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.png',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.',
    popupStyle: {
      background: '#F0FDF4',
      text: '#166534',
      border: '#BBF7D0',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    popupStyle: {
      background: '#1F2937',
      text: '#F3F4F6',
      border: '#374151',
      shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
    }
  },
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid',
    url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    popupStyle: {
      background: '#EEF2FF',
      text: '#3730A3',
      border: '#C7D2FE',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  }
};

export function getPopupContent(member: any, style: MapStyle) {
  const css = `
    .leaflet-popup-content-wrapper {
      background: ${style.popupStyle.background};
      color: ${style.popupStyle.text};
      border: 1px solid ${style.popupStyle.border};
      box-shadow: ${style.popupStyle.shadow};
      border-radius: 0.5rem;
      padding: 0;
    }
    .leaflet-popup-content {
      margin: 0;
      min-width: 200px;
    }
    .leaflet-popup-tip {
      background: ${style.popupStyle.background};
      border: 1px solid ${style.popupStyle.border};
    }
  `;

  return `
    <style>${css}</style>
    <div class="p-4">
      ${member.image ? `
        <div class="mb-3">
          <img 
            src="${member.image}" 
            alt="${member.name}" 
            style="width: 96px; height: 96px; border-radius: 50%; margin: 0 auto; object-fit: cover; border: 2px solid ${style.popupStyle.border};"
          />
        </div>
      ` : ''}
      <div style="text-align: center;">
        <h3 style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.25rem;">${member.name}</h3>
        ${member.title ? `<p style="font-size: 0.875rem; opacity: 0.8; margin-bottom: 0.25rem;">${member.title}</p>` : ''}
        <p style="font-size: 0.875rem; opacity: 0.7;">${member.location}</p>
        ${member.linkedin || member.website ? `
          <div style="margin-top: 0.75rem; display: flex; justify-content: center; gap: 0.5rem;">
            ${member.linkedin ? `
              <a 
                href="${member.linkedin}" 
                target="_blank" 
                rel="noopener noreferrer" 
                style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; border: 1px solid ${style.popupStyle.border}; color: ${style.popupStyle.text}; text-decoration: none;"
                onmouseover="this.style.opacity='0.8'"
                onmouseout="this.style.opacity='1'"
              >
                LinkedIn
              </a>
            ` : ''}
            ${member.website ? `
              <a 
                href="${member.website}" 
                target="_blank" 
                rel="noopener noreferrer" 
                style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; border: 1px solid ${style.popupStyle.border}; color: ${style.popupStyle.text}; text-decoration: none;"
                onmouseover="this.style.opacity='0.8'"
                onmouseout="this.style.opacity='1'"
              >
                Website
              </a>
            ` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

export function createMapTileLayer(style: MapStyle) {
  return {
    url: style.url,
    options: {
      attribution: style.attribution,
      maxZoom: 18,
      tileSize: 512,
      zoomOffset: -1,
      crossOrigin: true,
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    }
  };
}
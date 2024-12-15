import { Marker, Popup } from "react-leaflet";
import { Popup as PopupType } from 'react-leaflet';
import { CommunityMember, MapSettings } from "../../types";
import { icon } from "leaflet";
import { getMarkerIcon } from "../../utils/mapUtils";
import { useEffect, useRef } from "react";
import { trackEvent, ANALYTICS_EVENTS } from "../../services/analytics";

interface MapMarkerProps {
  member: CommunityMember;
  settings: MapSettings;
  showName?: boolean;
  mapId?: string;
}

export function MapMarker({ member, settings, showName = true, mapId }: MapMarkerProps) {
  if (!member.latitude || !member.longitude) return null;
  const popupRef = useRef<PopupType>(null);

  const position: [number, number] = [
    member.latitude,
    member.longitude,
  ];

  const markerSize = settings.style.markerStyle === 'photos' ? 40 : 25;
  const customIcon = icon({
    iconUrl: getMarkerIcon(settings.style.markerStyle, member),
    iconSize: settings.style.markerStyle === 'photos' ? [markerSize, markerSize] : [markerSize, 41],
    iconAnchor: settings.style.markerStyle === 'photos' ? [markerSize/2, markerSize/2] : [markerSize/2, 41],
    popupAnchor: settings.style.markerStyle === 'photos' ? [0, -(markerSize/2)] : [0, -41],
    className: settings.style.markerStyle === 'photos' ? 'rounded-full' : undefined,
  });

  const handleLinkClick = (linkType: 'website' | 'linkedin') => {
    trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_INTERACTION.PROFILE_LINK_CLICK,
      event_data: {
        map_id: mapId,
        link_type: linkType,
        member_name: member.name,
        member_location: member.location
      }
    });
  };

  return (
    <Marker 
      position={position} 
      icon={customIcon}
      eventHandlers={{
        click: () => {
          const popup = popupRef.current;
          if (popup) {
            const container = popup.getElement();
            if (container) {
              container.querySelector('.leaflet-popup-content')?.classList.add('map-popup');
            }
          }
        }
      }}
    >
      <Popup ref={popupRef} closeButton={false} className="map-popup">
        <div className="p-3 min-w-[200px]">
          {member.image && (
            <div className="mb-2 flex justify-center">
              <img
                src={member.image}
                alt={member.name || 'Member'}
                className="rounded-full w-16 h-16 object-cover"
              />
            </div>
          )}
          <div className="text-center">
            {showName && member.name && (
              <h3 className="text-lg font-semibold mb-1">
                {member.name}
              </h3>
            )}
            {member.title && (
              <p className="text-sm text-gray-600 mb-1">
                {member.title}
              </p>
            )}
            {member.location && (
              <p className="text-sm text-gray-600 mb-2">
                {member.location}
              </p>
            )}
            {member.description && (
              <p className="text-sm text-gray-600 mb-2">
                {member.description}
              </p>
            )}
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex justify-center gap-2">
                {member.website && (
                  <a
                    href={member.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick('website')}
                    className="px-3 py-1.5 bg-accent/10 rounded-md text-accent hover:bg-accent/20 text-sm font-medium transition-colors"
                  >
                    Website
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleLinkClick('linkedin')}
                    className="px-3 py-1.5 bg-accent/10 rounded-md text-accent hover:bg-accent/20 text-sm font-medium transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

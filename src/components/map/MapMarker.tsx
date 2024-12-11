import { Marker, Popup } from "react-leaflet";
import type { Popup as PopupType } from 'react-leaflet';
import { CommunityMember, MapSettings } from "../../types";
import { icon } from "leaflet";
import { getMarkerIcon } from "../../utils/mapUtils";
import { useEffect, useRef } from "react";

interface MapMarkerProps {
  member: CommunityMember;
  settings: MapSettings;
}

export function MapMarker({ member, settings }: MapMarkerProps) {
  if (!member.latitude || !member.longitude) return null;
  const popupRef = useRef<PopupType | null>(null);

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
            {member.name && (
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
              <div className="flex justify-center gap-1">
                {member.website && (
                  <a
                    href={member.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent hover:opacity-80 px-2.5 py-1 bg-accent/10 rounded-md"
                  >
                    website
                  </a>
                )}
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent hover:opacity-80 px-2.5 py-1 bg-accent/10 rounded-md flex items-center gap-1"
                  >
                    linked
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

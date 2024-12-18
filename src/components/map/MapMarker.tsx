import { Marker, Popup } from "react-leaflet";
import { Popup as PopupType } from 'react-leaflet';
import { CommunityMember, MapSettings } from "../../types";
import { icon } from "leaflet";
import { getMarkerIcon } from "../../utils/mapUtils";
import { useEffect, useRef } from "react";
import { trackEvent, ANALYTICS_EVENTS } from "../../services/analytics";
import { MapPopup } from './MapPopup';

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
    popupAnchor: settings.style.markerStyle === 'photos' ? [0, -(markerSize/4)] : [0, -20],
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
      <Popup 
        ref={popupRef} 
        closeButton={false} 
        className="leaflet-popup map-popup !p-0"
        maxWidth={350}
        minWidth={300}
        autoPan={true}
        offset={[0, -10]}
      >
        <MapPopup member={member} settings={settings} mapId={mapId} />
      </Popup>
    </Marker>
  );
}

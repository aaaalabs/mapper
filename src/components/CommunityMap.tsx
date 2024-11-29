import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CommunityMember } from '../types';
import { MapOptions } from './MapOptions';

interface CommunityMapProps {
  members: CommunityMember[];
  center: [number, number];
  options: MapOptions;
}

export function CommunityMap({ members, center, options }: CommunityMapProps) {
  useEffect(() => {
    // Fix Leaflet default icon path issues
    delete (Icon.Default.prototype as any)._getIconUrl;
    Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const createIcon = (member: CommunityMember) => {
    if (options.markerStyle === 'photos' && member.image) {
      return new Icon({
        iconUrl: member.image,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        className: 'rounded-full border-2 border-white shadow-md'
      });
    }
    return new Icon.Default();
  };

  const markers = members.map((member, index) => (
    <Marker
      key={`${member.name}-${index}`}
      position={[parseFloat(member.latitude), parseFloat(member.longitude)]}
      icon={createIcon(member)}
    >
      <Popup>
        <div className="text-center p-2">
          {options.markerStyle === 'photos' && member.image && (
            <img
              src={member.image}
              alt={member.name}
              className="w-24 h-24 rounded-full mx-auto mb-2"
            />
          )}
          <h3 className="font-semibold text-primary">{member.name}</h3>
          {member.title && (
            <p className="text-secondary text-sm">{member.title}</p>
          )}
          <p className="text-secondary text-sm">{member.location}</p>
          {options.enableSharing && (
            <div className="mt-2 space-x-2">
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-alt"
                >
                  LinkedIn
                </a>
              )}
              {member.website && (
                <a
                  href={member.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-alt"
                >
                  Website
                </a>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  ));

  return (
    <MapContainer
      center={center}
      zoom={2}
      className="h-[600px] w-full rounded-lg shadow-soft"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {options.enableClustering ? (
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {markers}
        </MarkerClusterGroup>
      ) : (
        markers
      )}
    </MapContainer>
  );
}
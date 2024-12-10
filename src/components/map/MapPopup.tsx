import React from 'react';
import { Popup } from 'react-leaflet';
import { CommunityMember } from '../../types';
import { MapSettings, defaultMapSettings } from '../../types/mapSettings';
import { getPopupStyles } from './styles';
import { cn } from '../../lib/utils';
import { Linkedin } from 'lucide-react';

interface MapPopupProps {
  member: Partial<CommunityMember>;
  settings?: MapSettings;
  className?: string;
}

export const MapPopup: React.FC<MapPopupProps> = ({ 
  member, 
  settings = defaultMapSettings,
  className 
}) => {
  const styles = getPopupStyles(settings);
  
  return (
    <Popup className={cn('map-popup', className)}>
      <div style={styles.wrapper} className={cn('p-3 min-w-[200px]', className)}>
        {member.image && (
          <div className="mb-2 flex justify-center">
            <img
              src={member.image}
              alt={member.name || 'Member'}
              style={styles.image}
              className="rounded-full w-16 h-16 object-cover"
            />
          </div>
        )}
        <div className="text-center">
          {member.name && (
            <h3 style={styles.title} className="text-lg font-semibold mb-1">
              {member.name}
            </h3>
          )}
          {member.location && (
            <p style={styles.text} className="text-sm text-gray-600 mb-2">
              {member.location}
            </p>
          )}
          {member.description && (
            <p style={styles.text} className="text-sm text-gray-600 mb-2">
              {member.description}
            </p>
          )}
          <div className="flex justify-center gap-2 mt-2">
            {member.website && (
              <a
                href={member.website}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
                className="text-sm text-accent hover:opacity-80 px-3 py-1.5 bg-accent/10 rounded-md"
              >
                Visit Website
              </a>
            )}
            {member.linkedin && (
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.link}
                className="text-sm text-accent hover:opacity-80 px-3 py-1.5 bg-accent/10 rounded-md flex items-center gap-1"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
};

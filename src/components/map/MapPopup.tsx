import React from 'react';
import { CommunityMember } from '../../types';
import { MapSettings, defaultMapSettings } from '../../types/mapSettings';
import { getPopupStyles } from './styles';
import { cn } from '../../lib/utils';
import { Linkedin } from 'lucide-react';
import { trackEvent, ANALYTICS_EVENTS } from '../../services/analytics';
import { FiGlobe, FiLinkedin } from 'lucide-react';

interface MapPopupProps {
  member: Partial<CommunityMember>;
  settings?: MapSettings;
  className?: string;
  mapId?: string;
}

export const MapPopup: React.FC<MapPopupProps> = ({ 
  member, 
  settings = defaultMapSettings,
  className,
  mapId 
}) => {
  const styles = React.useMemo(() => getPopupStyles(settings), [settings]);
  
  const handleLinkClick = (linkType: 'website' | 'linkedin', link: string) => {
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
    <div className="p-2.5 flex flex-col items-center text-center">
      {/* Profile Image */}
      {member.image && (
        <div className="mb-1.5">
          <img
            src={member.image}
            alt={member.name || 'Member'}
            style={styles.image}
            className="rounded-full w-14 h-14 object-cover"
          />
        </div>
      )}

      {/* Profile Info */}
      <div className="w-full space-y-0.5 mb-1">
        {member.name && (
          <h3 style={styles.title} className="font-semibold leading-snug">
            {member.name}
          </h3>
        )}
        {member.title && (
          <p style={styles.subtitle} className="text-sm leading-snug">
            {member.title}
          </p>
        )}
        {member.location && (
          <p style={styles.text} className="text-xs leading-snug">
            {member.location}
          </p>
        )}
      </div>

      {/* Description */}
      {member.description && (
        <div className="w-full mb-1.5">
          <p style={styles.text} className="text-sm line-clamp-2">
            {member.description}
          </p>
        </div>
      )}

      {/* Links */}
      {(member.website || member.linkedin) && (
        <div className="grid grid-cols-1 gap-1.5 w-full">
          {member.website && (
            <a
              href={member.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick('website', member.website)}
              className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              Website
            </a>
          )}
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick('linkedin', member.linkedin)}
              className="flex items-center justify-center gap-1 px-2.5 py-1 text-xs rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <Linkedin size={12} />
              LinkedIn
            </a>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useEffect } from 'react';
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
  const isDarkTheme = settings.style.id === 'dark';
  const styles = React.useMemo(() => getPopupStyles(settings), [settings]);

  useEffect(() => {
    // Update theme on the body element
    if (isDarkTheme) {
      document.body.setAttribute('data-theme', 'dark');
    } else {
      document.body.removeAttribute('data-theme');
    }

    return () => {
      // Cleanup
      document.body.removeAttribute('data-theme');
    };
  }, [isDarkTheme]);

  const handleLinkClick = (linkType: 'website' | 'linkedin', link: string) => {
    trackEvent({
      event_name: ANALYTICS_EVENTS.MAP_INTERACTION.PROFILE_LINK_CLICK,
      event_data: {
        map_id: mapId,
        link_type: linkType,
        link_url: link,
        member_name: member.name,
        member_location: member.location,
        timestamp: new Date().toISOString()
      }
    });
  };

  const formatUrl = (url: string): string => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;
  };

  return (
    <div className={cn(
      "flex flex-col items-center text-center",
      isDarkTheme ? "text-gray-50" : "text-gray-900"
    )}>
      {/* Profile Image */}
      {member.image && (
        <div className="mb-1.5">
          <img
            src={member.image}
            alt={member.name || 'Member'}
            style={styles.image}
            className={cn(
              "rounded-full w-14 h-14 object-cover",
              isDarkTheme && "ring-1 ring-gray-500"
            )}
          />
        </div>
      )}

      {/* Profile Info */}
      <div className="w-full space-y-0.5 mb-1">
        {member.name && (
          <h3 className={cn(
            "font-semibold text-base leading-snug",
            isDarkTheme ? "text-gray-50" : "text-gray-900"
          )}>
            {member.name}
          </h3>
        )}
        {member.title && (
          <p className={cn(
            "text-sm leading-snug",
            isDarkTheme ? "text-gray-200" : "text-gray-700"
          )}>
            {member.title}
          </p>
        )}
        {member.location && (
          <p className={cn(
            "text-xs leading-snug",
            isDarkTheme ? "text-gray-300" : "text-gray-600"
          )}>
            {member.location}
          </p>
        )}
      </div>

      {/* Description */}
      {member.description && (
        <div className="w-full mb-1.5">
          <p className={cn(
            "text-sm line-clamp-2",
            isDarkTheme ? "text-gray-200" : "text-gray-700"
          )}>
            {member.description}
          </p>
        </div>
      )}

      {/* Links */}
      {(member.website || member.linkedin) && (
        <div className="grid grid-cols-1 gap-1.5 w-full">
          {member.website && (
            <a
              href={formatUrl(member.website)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick('website', member.website)}
              className={cn(
                "flex items-center justify-center gap-1 px-2.5 py-1 text-xs rounded-full transition-colors",
                isDarkTheme 
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-50 border border-gray-500" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
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
              className={cn(
                "flex items-center justify-center gap-1 px-2.5 py-1 text-xs rounded-full transition-colors",
                isDarkTheme 
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-50 border border-gray-500" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
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

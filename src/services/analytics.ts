import { supabase } from '../config/supabase';

// Generate a random UUID using Web Crypto API
const generateUUID = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  // Set version (4) and variant (2) bits
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;
  
  // Convert to hex string
  const hex = Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};

// Analytics event categories
export const ANALYTICS_EVENTS = {
  MAP_CREATION: {
    START: 'map_creation_started',
    COMPLETE: 'map_creation_completed',
    ERROR: 'map_creation_error'
  },
  MAP_DOWNLOAD: {
    STARTED: 'map_download_started',
    COMPLETED: 'map_download_completed',
    ERROR: 'map_download_error'
  },
  MAP_SHARING: {
    INITIATED: 'map_sharing_initiated',
    COMPLETED: 'map_sharing_completed',
    ERROR: 'map_sharing_error'
  },
  MAP_INTERACTION: {
    VIEW: 'map_viewed',
    ZOOM: 'map_zoomed',
    PAN: 'map_panned',
    MARKER_CLICK: 'marker_clicked',
    PROFILE_LINK_CLICK: 'profile_link_clicked'
  },
  FEEDBACK: {
    RATING: 'feedback_rating_submitted',
    COMMENT: 'feedback_comment_submitted'
  }
} as const;

export interface AnalyticsEvent {
  event_name: string;
  session_id: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

export interface FeatureEvent {
  feature_id: string;
  event_type: string;
  user_id?: string;
  duration_ms?: number;
  success?: boolean;
  error_message?: string;
  metadata?: Record<string, any>;
}

// Get or create session ID
export const getSessionId = () => {
  let session_id = sessionStorage.getItem('map_session_id');
  if (!session_id) {
    session_id = generateUUID();
    sessionStorage.setItem('map_session_id', session_id);
  }
  return session_id;
};

export const trackEvent = async ({
  event_name,
  metadata = {},
  session_id = getSessionId(),
  timestamp = new Date().toISOString()
}: AnalyticsEvent) => {
  const { error } = await supabase
    .from('map_analytics_events')
    .insert({
      event_name,
      session_id,
      metadata,
      timestamp
    });

  if (error) {
    console.error('Failed to track event:', error);
  }
};

export const trackFeatureEvent = async ({
  feature_id,
  event_type,
  user_id,
  duration_ms,
  success = true,
  error_message,
  metadata = {}
}: FeatureEvent) => {
  const { error } = await supabase
    .from('map_feature_events')
    .insert({
      feature_id,
      event_type,
      user_id,
      duration_ms,
      success,
      error_message,
      metadata
    });

  if (error) {
    console.error('Failed to track feature event:', error);
  }
};

// Helper function to track page views
export const trackPageView = (page: string) => {
  return trackEvent({
    event_name: 'page_view',
    session_id: getSessionId(),
    metadata: { page }
  });
};

// Helper function to track map interactions
export const trackMapInteraction = (action: string, mapId?: string) => {
  return trackEvent({
    event_name: `map_${action}`,
    session_id: getSessionId(),
    metadata: mapId ? { map_id: mapId } : undefined
  });
};

// Helper function to track errors
export const trackError = (error: Error, context: string) => {
  return trackEvent({
    event_name: 'error',
    session_id: getSessionId(),
    metadata: {
      error_message: error.message,
      error_stack: error.stack,
      context
    }
  });
};
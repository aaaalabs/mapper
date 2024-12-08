import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
    MARKER_CLICK: 'marker_clicked'
  },
  FEEDBACK: {
    RATING: 'feedback_rating_submitted',
    COMMENT: 'feedback_comment_submitted'
  }
} as const;

// Get or create session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('map_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('map_session_id', sessionId);
  }
  return sessionId;
};

interface TrackEventParams {
  event_name: string;
  event_data?: Record<string, any>;
}

export const trackEvent = async ({ event_name, event_data = {} }: TrackEventParams) => {
  try {
    const sessionId = getSessionId();
    
    const { error } = await supabase
      .from('map_analytics_events')
      .insert({
        event_name,
        event_data,
        session_id: sessionId
      });

    if (error) {
      console.error('Failed to track event:', error);
    }
  } catch (err) {
    // Fail silently in production, log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Analytics error:', err);
    }
  }
};

// Helper function to track page views
export function trackPageView(page: string) {
  return trackEvent({
    event_name: 'page_view',
    event_data: { page }
  });
}

// Helper function to track map interactions
export function trackMapInteraction(action: string, mapId?: string) {
  return trackEvent({
    event_name: action,
    event_data: { map_id: mapId }
  });
}

// Helper function to track errors
export function trackError(error: Error, context: string) {
  return trackEvent({
    event_name: 'error',
    event_data: {
      error_message: error.message,
      error_stack: error.stack,
      context
    }
  });
} 
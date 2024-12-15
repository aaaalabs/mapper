import { supabase } from '../config/supabase';
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
    MARKER_CLICK: 'marker_clicked',
    PROFILE_LINK_CLICK: 'profile_link_clicked'
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
    if (!event_name) {
      console.error('Event name is required for analytics tracking');
      return;
    }

    const sessionId = getSessionId();
    
    // Add debug logging
    console.log('Attempting to track event:', { 
      event_name, 
      event_data,
      sessionId,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      keyLength: import.meta.env.VITE_SUPABASE_ANON_KEY?.length
    });
    
    // Test Supabase connection before insert
    const { data: testData, error: testError } = await supabase
      .from('map_analytics_events')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return;
    }
    
    console.log('Supabase connection test succeeded:', testData);
    
    const { data, error } = await supabase
      .from('map_analytics_events')
      .insert({
        event_name,
        session_id: sessionId,
        metadata: event_data,
        timestamp: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to track event:', {
        error,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint
      });
      throw error;
    }

    console.log('Successfully tracked event:', data);
    return data;
  } catch (err) {
    console.error('Analytics error:', err);
    throw err;
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
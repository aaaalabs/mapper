import { supabase } from '../lib/supabase';

// Generate a UUID for session tracking
const generateUUID = () => {
  return crypto.randomUUID();
};

// Analytics event categories
export const ANALYTICS_EVENTS = {
  MAP_CREATION: {
    STARTED: 'map_creation_started',
    COMPLETED: 'map_creation_completed',
    ERROR: 'map_creation_error',
    CREATED: 'map_created'
  },
  MAP_DOWNLOAD: {
    STARTED: 'map_download_started',
    COMPLETED: 'map_download_completed',
    ERROR: 'map_download_error'
  },
  MAP_SHARING: {
    STARTED: 'map_sharing_started',
    COMPLETED: 'map_sharing_completed',
    ERROR: 'map_sharing_error',
    INITIATED: 'map_sharing_initiated'
  },
  MAP_INTERACTION: {
    VIEW: 'map_viewed',
    EDIT: 'map_edited',
    SHARE: 'map_shared',
    DELETE: 'map_deleted',
    ZOOM: 'map_zoomed',
    PAN: 'map_panned',
    MARKER_CLICK: 'marker_clicked',
    PROFILE_LINK_CLICK: 'profile_link_clicked',
    SETTINGS_UPDATED: 'map_settings_updated'
  },
  USER_ACTION: {
    LOGIN: 'user_login',
    SIGNUP: 'user_signup',
    SETTINGS: 'settings_changed'
  },
  SYSTEM: {
    ERROR: 'error',
    PAGE_VIEW: 'page_view'
  },
  PAYMENT: {
    INITIATED: 'payment_initiated',
    COMPLETED: 'payment_completed',
    FAILED: 'payment_failed',
    CANCELLED: 'payment_cancelled',
    ERROR: 'payment_error'
  },
  BETA: {
    SIGNUP: 'beta_signup'
  },
  ORDER: {
    COMPLETION_VIEW: 'order_completion_view',
    BOOKING_STARTED: 'order_booking_started',
    BOOKING_COMPLETED: 'order_booking_completed'
  },
  FEEDBACK: {
    RATING: 'feedback_rating',
    COMMENT: 'feedback_comment'
  },
  DATA_EXTRACTION: {
    REQUEST: 'data_extraction_request',
    COMPLETE: 'data_extraction_completed',
    ERROR: 'data_extraction_error'
  },
  FEATURE: {
    USED: 'feature_used',
    ENABLED: 'feature_enabled',
    DISABLED: 'feature_disabled',
    CONFIGURED: 'feature_configured'
  },
  PERFORMANCE: {
    METRIC: 'performance_metric'
  }
} as const;

// Helper type to extract all event values
type EventValues<T> = T extends { [key: string]: infer U }
  ? U extends { [key: string]: infer V }
    ? V extends string
      ? V
      : U extends string
        ? U
        : never
    : never
  : never;

// Type for all possible event names
export type EventNames = EventValues<typeof ANALYTICS_EVENTS>;

// Analytics event interface
export interface AnalyticsEvent {
  event_name: EventNames;
  event_data?: Record<string, any>;
  session_id?: string;
  timestamp?: string;
}

// Get or create session ID
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('mapper_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('mapper_session_id', sessionId);
  }
  return sessionId;
};

export const trackEvent = async ({
  event_name,
  event_data = {},
  session_id = getSessionId(),
  timestamp = new Date().toISOString()
}: AnalyticsEvent): Promise<boolean> => {
  try {
    // Ensure event_name is not null or undefined
    if (!event_name) {
      console.error('Analytics error: event_name cannot be null or undefined');
      return false;
    }

    const { data, error } = await supabase
      .from('map_analytics_events')
      .insert({
        event_name,
        session_id,
        event_data: JSON.stringify(event_data),
        timestamp
      })
      .select();

    if (error) {
      console.error('Analytics error:', error.message);
      return false;
    }

    console.log('Analytics event tracked:', {
      event_name,
      event_data,
      session_id,
      timestamp,
      response: data
    });

    return true;
  } catch (error) {
    console.error('Failed to track event:', error);
    return false;
  }
};

// Helper function to track map interactions
export const trackMapInteraction = async (action: keyof typeof ANALYTICS_EVENTS.MAP_INTERACTION, mapId?: string): Promise<boolean> => {
  return trackEvent({
    event_name: ANALYTICS_EVENTS.MAP_INTERACTION[action],
    event_data: mapId ? { map_id: mapId } : undefined
  });
};

// Helper function to track errors
export const trackError = async (error: Error, context: string, type?: string): Promise<boolean> => {
  return trackEvent({
    event_name: ANALYTICS_EVENTS.SYSTEM.ERROR,
    event_data: {
      error_message: error.message,
      error_stack: error.stack,
      context,
      type
    }
  });
};

// Helper function to track page views
export const trackPageView = async (page: string, performanceData?: Record<string, any>): Promise<boolean> => {
  return trackEvent({
    event_name: ANALYTICS_EVENTS.SYSTEM.PAGE_VIEW,
    event_data: {
      page,
      ...performanceData
    }
  });
};

// Helper function to track feature usage
export const trackFeature = async (
  featureName: string, 
  action: keyof typeof ANALYTICS_EVENTS.FEATURE, 
  event_data?: Record<string, any>
): Promise<boolean> => {
  return trackEvent({
    event_name: ANALYTICS_EVENTS.FEATURE[action],
    event_data: {
      feature: featureName,
      ...event_data
    }
  });
};

// Helper function to track performance
export const trackPerformance = async (
  metric: string,
  data: Record<string, any>
): Promise<boolean> => {
  return trackEvent({
    event_name: ANALYTICS_EVENTS.PERFORMANCE.METRIC,
    event_data: {
      metric,
      ...data
    }
  });
};
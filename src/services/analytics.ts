import { supabase } from '../lib/supabase';

// Generate a UUID for session tracking
const generateUUID = () => {
  return crypto.randomUUID();
};

// Analytics event categories
export const ANALYTICS_EVENTS = {
  MAP_CREATION: {
    START: 'map_creation_started',
    COMPLETE: 'map_creation_completed',
    ERROR: 'map_creation_error',
    CREATED: 'map_created'
  },
  MAP_DOWNLOAD: {
    START: 'map_download_started',
    COMPLETE: 'map_download_completed',
    ERROR: 'map_download_error'
  },
  MAP_SHARING: {
    START: 'map_sharing_started',
    COMPLETE: 'map_sharing_completed',
    ERROR: 'map_sharing_error'
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

type EventValues<T> = T extends { [key: string]: infer U }
  ? U extends { [key: string]: string }
    ? U[keyof U]
    : never
  : never;

export type EventNames = EventValues<typeof ANALYTICS_EVENTS>;

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
  await trackEvent({
    event_name: ANALYTICS_EVENTS.MAP_INTERACTION[action],
    event_data: { map_id: mapId }
  });
  return true;
};

// Helper function to track errors
export const trackError = async (error: Error, context: string, type?: string): Promise<boolean> => {
  await trackEvent({
    event_name: ANALYTICS_EVENTS.SYSTEM.ERROR,
    event_data: {
      error_message: error.message,
      error_stack: error.stack,
      error_type: type || error.name,
      context
    }
  });
  return true;
};

// Helper function to track page views
export const trackPageView = async (page: string, performanceData?: Record<string, any>): Promise<boolean> => {
  await trackEvent({
    event_name: ANALYTICS_EVENTS.SYSTEM.PAGE_VIEW,
    event_data: { page, ...(performanceData && { performance_data: performanceData }) }
  });
  return true;
};

// Helper function to track feature usage
export const trackFeature = async (
  featureName: string, 
  action: keyof typeof ANALYTICS_EVENTS.FEATURE, 
  event_data?: Record<string, any>
): Promise<boolean> => {
  await trackEvent({
    event_name: ANALYTICS_EVENTS.FEATURE[action],
    event_data: {
      ...event_data,
      feature_name: featureName
    }
  });
  return true;
};

// Helper function to track performance
export const trackPerformance = async (
  metric: string,
  data: Record<string, any>
): Promise<boolean> => {
  await trackEvent({
    event_name: ANALYTICS_EVENTS.PERFORMANCE.METRIC,
    event_data: { metric, ...data }
  });
  return true;
};
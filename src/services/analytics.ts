import { supabase } from '../lib/supabase';

// Generate a UUID for session tracking
const generateUUID = () => {
  return crypto.randomUUID();
};

// Analytics event categories
export const ANALYTICS_EVENTS = {
  MAP: {
    CREATED: 'map.created',
    VIEWED: 'map.viewed',
    SHARED: 'map.shared',
    DOWNLOADED: 'map.downloaded',
    DELETED: 'map.deleted'
  },
  USER: {
    SESSION_START: 'user.session_start',
    PAGE_VIEW: 'user.page_view',
    FEATURE_USED: 'user.feature_used'
  },
  INTERACTION: {
    BUTTON_CLICK: 'interaction.button_click',
    FORM_SUBMIT: 'interaction.form_submit',
    MODAL_OPEN: 'interaction.modal_open',
    MODAL_CLOSE: 'interaction.modal_close'
  },
  BETA: {
    SIGNUP: 'beta.signup',
    WAITLIST: 'beta.waitlist'
  },
  ORDER: {
    COMPLETION_VIEW: 'order.completion_view',
    BOOKING_STARTED: 'order.booking_started'
  },
  FEEDBACK: {
    INITIAL: 'feedback.initial',
    COMMENT: 'feedback.comment'
  }
};

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  MAP = 'MAP',
  USER = 'USER',
  FEEDBACK = 'FEEDBACK',
  LEAD = 'LEAD',
  SYSTEM = 'SYSTEM'
}

export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  feature_metadata?: Record<string, any>;
  error_type?: string;
  error_message?: string;
  performance_data?: Record<string, any>;
  session_id?: string;
  anonymous_id?: string;
}

export interface ErrorContext {
  category: ErrorCategory;
  subcategory: string;
  severity: ErrorSeverity;
  metadata?: Record<string, any>;
}

// Check if current page is an admin page
export const isAdminPage = () => {
  return window.location.pathname.startsWith('/admin');
};

// Get or create a session ID
export const getSessionId = (): string => {
  // Don't track sessions on admin pages
  if (isAdminPage()) return '';
  
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Track an analytics event
export const trackEvent = async (event: AnalyticsEvent) => {
  // Don't track events on admin pages
  if (isAdminPage()) return;
  
  try {
    const { error } = await supabase.from('map_analytics_events').insert({
      event_type: event.event_type,
      event_data: event.event_data || {},
      feature_metadata: event.feature_metadata,
      error_type: event.error_type,
      error_message: event.error_message,
      performance_data: event.performance_data,
      session_id: event.session_id || getSessionId(),
      anonymous_id: event.anonymous_id
    });

    if (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in trackEvent:', error);
    // Don't throw here to prevent cascading failures
  }
};

// Track error with context
export const trackErrorWithContext = async (error: Error, context: ErrorContext) => {
  try {
    await trackEvent({
      event_type: 'error',
      event_data: {
        message: error.message,
        stack: error.stack,
        ...context.metadata
      },
      error_type: context.category,
      error_message: error.message,
      feature_metadata: {
        category: context.category,
        subcategory: context.subcategory,
        severity: context.severity
      }
    });
  } catch (trackingError) {
    console.error('Error in trackErrorWithContext:', trackingError);
    // Don't throw here to prevent cascading failures
  }
};
import { supabase } from '../lib/supabase';

// Analytics event categories
export const ANALYTICS_EVENTS = {
  MAP: {
    CREATED: 'map.created',
    VIEWED: 'map.viewed',
    SHARED: 'map.shared',
    DOWNLOADED: 'map.downloaded',
    DELETED: 'map.deleted',
    CREATION: {
      STARTED: 'map.creation.started',
      COMPLETED: 'map.creation.completed',
      ERROR: 'map.creation.error'
    }
  },
  USER: {
    SESSION_START: 'user.session_start',
    PAGE_VIEW: 'user.page_view',
    FEATURE_USED: 'user.feature_used'
  },
  ORDER: {
    INITIATED: 'order.initiated',
    CREATED: 'order.created',
    COMPLETED: 'order.completed',
    FAILED: 'order.failed',
    COMPLETION_VIEW: 'order.completion_view'
  },
  FEEDBACK: {
    SUBMITTED: 'feedback.submitted',
    UPDATED: 'feedback.updated'
  },
  SESSION: {
    START: 'session.start',
    END: 'session.end',
    UPDATE: 'session.update'
  },
  BETA: {
    WAITLIST_JOIN: 'beta.waitlist_join',
    FEEDBACK_SUBMIT: 'beta.feedback_submit'
  },
  SYSTEM: {
    ERROR: {
      GENERAL: 'system.error.general',
      MAP: 'system.error.map',
      PAYMENT: 'system.error.payment',
      LEAD: 'system.error.lead',
      FEEDBACK: 'system.error.feedback',
      ANALYTICS: 'system.error.analytics',
      GEOCODING: 'system.error.geocoding'
    },
    PERFORMANCE: 'system.performance',
    SESSION: 'system.session'
  }
};

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const
} as const;

export type ErrorSeverity = typeof ERROR_SEVERITY[keyof typeof ERROR_SEVERITY];

// Error categories
export const ERROR_CATEGORY = {
  SYSTEM: 'SYSTEM' as const,
  MAP: 'MAP' as const,
  PAYMENT: 'PAYMENT' as const,
  LEAD: 'LEAD' as const,
  FEEDBACK: 'FEEDBACK' as const,
  ANALYTICS: 'ANALYTICS' as const,
  GEOCODING: 'GEOCODING' as const
} as const;

export type ErrorCategory = typeof ERROR_CATEGORY[keyof typeof ERROR_CATEGORY];

// Error metadata interface
export interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  subcategory?: string;
  metadata?: Record<string, any>;
  componentName?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
}

// Analytics event interface
export interface AnalyticsEvent {
  event_name: string;
  session_id?: string;
  event_data?: Record<string, any>;
  feature_name?: string;
  feature_metadata?: Record<string, any>;
  error_type?: string;
  error_message?: string;
  performance_data?: Record<string, any>;
  anonymous_id?: string;
}

// Generate a UUID for session tracking
export const generateUUID = (): string => {
  // Fallback for browsers that don't support crypto.randomUUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback implementation using Math.random()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Check if current page is an admin page
export const isAdminPage = () => {
  return window.location.pathname.startsWith('/admin');
};

// Get or create a session ID
export const getSessionId = (): string | null => {
  // Don't track sessions on admin pages
  if (isAdminPage()) return null;
  
  let sessionId = localStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Get anonymous ID
const getAnonymousId = (): string => {
  // Implementation of anonymous ID logic
  return 'anonymous-id';
};

export const trackEvent = async (
  eventNameOrObject: string | { event_name: string; event_data?: Record<string, any> },
  eventData?: Record<string, any>
): Promise<void> => {
  try {
    const event_name = typeof eventNameOrObject === 'string' ? eventNameOrObject : eventNameOrObject.event_name;
    const data = typeof eventNameOrObject === 'string' ? eventData : eventNameOrObject.event_data;

    const { error } = await supabase.from('map_analytics_events').insert({
      event_name,
      event_data: data || {},
      session_id: getSessionId(),
      anonymous_id: getAnonymousId()
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to track event:', error);
  }
};

export const trackError = async (error: Error, metadata: ErrorMetadata): Promise<void> => {
  try {
    const errorEvent = ANALYTICS_EVENTS.SYSTEM.ERROR[metadata.category === 'SYSTEM' ? 'GENERAL' : metadata.category] || ANALYTICS_EVENTS.SYSTEM.ERROR.GENERAL;

    const timestamp = new Date().toISOString();

    await trackEvent({
      event_name: errorEvent,
      event_data: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        category: metadata.category,
        subcategory: metadata.subcategory,
        severity: metadata.severity,
        metadata: metadata.metadata,
        componentName: metadata.componentName,
        url: metadata.url || window.location.href,
        userAgent: metadata.userAgent || navigator.userAgent,
        timestamp
      }
    });
  } catch (e) {
    console.error('Failed to track error:', e);
  }
};
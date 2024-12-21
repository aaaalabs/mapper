import { trackEvent } from './analytics';
import { ANALYTICS_EVENTS } from './analytics';
import * as Sentry from '@sentry/react';
import { captureConsoleError } from '../config/sentry';

// Error severity levels for better categorization
export enum ErrorSeverity {
  LOW = 'low',        // Minor UI glitches, non-critical features
  MEDIUM = 'medium',  // User experience affected but functionality intact
  HIGH = 'high',      // Critical functionality broken
  CRITICAL = 'critical' // System-wide failures
}

// Error categories for better organization
export type ErrorCategory = 
  | 'AUTH'
  | 'SESSION'
  | 'PAYMENT'
  | 'MAP'
  | 'USER'
  | 'SYSTEM'
  | 'API'
  | 'DATABASE';

// Error subcategories for specific error types
export type ErrorSubcategory<T extends ErrorCategory> = T extends 'AUTH' 
  ? 'SIGN_IN' | 'SIGN_OUT' | 'SESSION' | 'ADMIN_CHECK'
  : T extends 'SESSION'
  ? 'CREATION' | 'UPDATE' | 'FETCH' | 'CLEANUP'
  : T extends 'PAYMENT'
  ? 'INITIATE' | 'PROCESS' | 'VERIFY' | 'REFUND'
  : T extends 'MAP'
  ? 'CREATE' | 'UPDATE' | 'DELETE' | 'SHARE'
  : T extends 'USER'
  ? 'PROFILE' | 'PREFERENCES' | 'ACTIVITY'
  : T extends 'SYSTEM'
  ? 'STARTUP' | 'SHUTDOWN' | 'MAINTENANCE'
  : T extends 'API'
  ? 'REQUEST' | 'RESPONSE' | 'TIMEOUT'
  : T extends 'DATABASE'
  ? 'QUERY' | 'CONNECTION' | 'MIGRATION'
  : never;

// Convert ErrorSeverity to Sentry Level
function getSentryLevel(severity: ErrorSeverity): Sentry.SeverityLevel {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
      return 'fatal';
    case ErrorSeverity.HIGH:
      return 'error';
    case ErrorSeverity.MEDIUM:
      return 'warning';
    case ErrorSeverity.LOW:
      return 'info';
    default:
      return 'error';
  }
}

// Metadata interface for error tracking
export interface ErrorMetadata {
  url?: string;
  userAgent?: string;
  timestamp?: string;
  sessionId?: string;
  mapId?: string;
  requestId?: string;
  component?: string;
  feature?: string;
  [key: string]: string | undefined;
}

// Error context interface
export interface ErrorContext {
  category: ErrorCategory;
  subcategory?: string;
  severity: ErrorSeverity;
  componentName?: string;
  action?: string;
  userId?: string;
  metadata?: ErrorMetadata;
  recoveryAction?: {
    type: 'retry' | 'fallback' | 'reset' | 'ignore';
    description: string;
  };
}

// Error data interface
export interface ErrorData {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  category: ErrorCategory;
  subcategory?: string;
  severity: ErrorSeverity;
  componentName?: string;
  action?: string;
  userId?: string;
  metadata: ErrorMetadata;
  recoveryAction?: {
    type: 'retry' | 'fallback' | 'reset' | 'ignore';
    description: string;
  };
  url: string;
  userAgent: string;
  timestamp: string;
}

/**
 * Tracks an error with enriched context in map_analytics_events and Sentry
 */
export async function trackErrorWithContext(
  error: Error,
  context: ErrorContext
): Promise<boolean> {
  try {
    const errorData: ErrorData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      category: context.category,
      subcategory: context.subcategory,
      severity: context.severity,
      componentName: context.componentName,
      action: context.action,
      userId: context.userId,
      metadata: {
        ...context.metadata,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      },
      recoveryAction: context.recoveryAction,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };

    // Track in Sentry with enhanced context
    Sentry.withScope((scope) => {
      scope.setLevel(getSentryLevel(context.severity));
      scope.setTags({
        category: context.category,
        subcategory: context.subcategory,
        component: context.componentName,
        source: 'error-tracking'
      });
      scope.setExtras({
        action: context.action,
        metadata: context.metadata,
        recoveryAction: context.recoveryAction
      });
      
      // Capture as exception for better stack traces
      Sentry.captureException(error);
    });

    // Also track in analytics for non-Sentry tracking
    await trackEvent({
      event_name: ANALYTICS_EVENTS.SYSTEM.ERROR,
      event_data: errorData
    });

    return true;
  } catch (e) {
    // Capture tracking failure
    captureConsoleError('Error tracking failed', {
      originalError: error,
      trackingError: e
    });
    return false;
  }
}

/**
 * Tracks error recovery attempts
 * @param error - The original error
 * @param recoveryMethod - Method used to recover
 * @param successful - Whether recovery was successful
 */
export async function trackErrorRecovery(
  error: Error,
  recoveryMethod: string,
  successful: boolean
): Promise<boolean> {
  // Track recovery in Sentry
  Sentry.withScope((scope) => {
    scope.setLevel(successful ? 'info' : 'warning');
    scope.setTag('recovery_method', recoveryMethod);
    scope.setTag('recovery_successful', String(successful));
    Sentry.captureMessage(`Error Recovery: ${recoveryMethod} ${successful ? 'succeeded' : 'failed'}`);
  });

  return trackEvent({
    event_name: ANALYTICS_EVENTS.SYSTEM.ERROR,
    event_data: {
      error: {
        message: error.message,
        name: error.name
      },
      recovery_method: recoveryMethod,
      successful,
      timestamp: new Date().toISOString(),
      sessionId: localStorage.getItem('session_id') || undefined
    }
  });
}

/**
 * Creates an error tracking wrapper for async functions
 * @param fn - Async function to wrap
 * @param context - Error context
 */
export function withErrorTracking<T>(
  fn: () => Promise<T>,
  context: Omit<ErrorContext, 'severity'>
) {
  return Sentry.withScope(async (scope) => {
    try {
      scope.setTags({
        category: context.category,
        subcategory: context.subcategory,
        component: context.componentName
      });
      return await fn();
    } catch (error) {
      await trackErrorWithContext(error instanceof Error ? error : new Error(String(error)), {
        ...context,
        severity: ErrorSeverity.HIGH // Default to HIGH for uncaught errors
      });
      throw error;
    }
  });
}

/**
 * Helper to create error context with type safety
 */
export function createErrorContext<T extends ErrorCategory>(
  category: T,
  subcategory: ErrorSubcategory<T>,
  severity: ErrorSeverity,
  metadata?: ErrorMetadata
): ErrorContext {
  return {
    category,
    subcategory,
    severity,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  };
}

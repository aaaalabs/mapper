import * as Sentry from '@sentry/react';

let isInitialized = false;

// Check if current page is an admin page
const isAdminPage = () => window.location.pathname.startsWith('/admin');

/**
 * Initialize Sentry error tracking
 * Captures all console issues and browser errors
 * Excludes all admin pages from tracking
 */
export function initSentry() {
  if (isInitialized || isAdminPage()) return;
  isInitialized = true;

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [],
    // Set proper sampling rates
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV,
    
    // Don't track admin pages
    denyUrls: [
      /\/admin/,
    ],
    
    beforeSend(event) {
      // Don't track admin routes
      if (isAdminPage()) {
        return null;
      }

      // Add minimal context without any user data
      event.extra = {
        url: window.location.pathname,
        timestamp: new Date().toISOString()
      };

      // Remove any user information
      delete event.user;
      
      return event;
    },
  });
}

// Helper to manually capture console errors with additional context
export function captureConsoleError(error: Error | string, context?: Record<string, any>) {
  // Don't capture errors from admin pages
  if (isAdminPage()) return;

  Sentry.captureException(error, {
    extra: {
      ...context,
      timestamp: new Date().toISOString()
    }
  });
}

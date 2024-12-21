import * as Sentry from '@sentry/react';

let isInitialized = false;

/**
 * Initialize Sentry error tracking
 * Captures all console issues and browser errors
 */
export function initSentry() {
  if (isInitialized) return;
  isInitialized = true;

  // Initialize Sentry with enhanced configuration
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Set proper sampling rates
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    environment: process.env.NODE_ENV,
    // Only track errors from our domain and Supabase
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/mapper\.voiceloop\.io/,
      /^https:\/\/.*\.supabase\.co/
    ],
    beforeSend(event) {
      // Don't track events from admin routes to prevent loops
      if (window.location.pathname.startsWith('/admin')) {
        return null;
      }

      // Only track errors for admin user
      const user = event.user?.email;
      if (user && user !== 'admin@libralab.ai') {
        return null;
      }

      // Add minimal but useful context
      event.extra = {
        url: window.location.href,
        timestamp: new Date().toISOString()
      };
      return event;
    },
    // Ignore specific errors that might cause loops
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      'Failed to fetch',
      'Network request failed',
      /^Loading chunk \d+ failed/,
      /^Loading CSS chunk \d+ failed/,
      /^Invalid attempt to spread non-iterable/,
      /^Cannot read property/,
      /^Cannot access/,
      /^Maximum update depth exceeded/
    ],
  });

  // Add default context
  Sentry.setTag('app', 'mapper');
}

// Helper to manually capture console errors with additional context
export function captureConsoleError(error: Error | string, context?: Record<string, any>) {
  // Don't capture errors from admin routes
  if (window.location.pathname.startsWith('/admin')) {
    return;
  }

  if (error instanceof Error) {
    Sentry.captureException(error, { extra: context });
  } else {
    Sentry.captureMessage(error, {
      level: 'error',
      extra: context,
    });
  }
}

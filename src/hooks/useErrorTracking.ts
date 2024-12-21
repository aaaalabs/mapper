import { useCallback } from 'react';
import { trackErrorWithContext, ErrorSeverity, ErrorCategory } from '../services/errorTracking';

interface ErrorTrackingOptions {
  category?: ErrorCategory;
  subcategory?: string;
  severity?: ErrorSeverity;
  metadata?: Record<string, string>;
}

const defaultOptions: ErrorTrackingOptions = {
  category: 'SYSTEM',
  severity: ErrorSeverity.MEDIUM
};

/**
 * Custom hook for tracking errors with context
 * @example
 * ```tsx
 * const { trackError } = useErrorTracking({ category: 'MyComponent' });
 * 
 * try {
 *   // Some code that might throw
 * } catch (error) {
 *   trackError(error, { subcategory: 'save_data' });
 * }
 * ```
 */
export function useErrorTracking(defaultCategory?: ErrorCategory) {
  const trackError = useCallback(
    async (error: Error, options: ErrorTrackingOptions = {}) => {
      try {
        await trackErrorWithContext(error, {
          category: options.category || defaultCategory || defaultOptions.category!,
          subcategory: options.subcategory,
          severity: options.severity || defaultOptions.severity!,
          metadata: {
            ...options.metadata,
            url: window.location.href,
            userAgent: navigator.userAgent
          }
        });
      } catch (err) {
        // Fallback to console in case error tracking itself fails
        console.error('Error tracking failed:', err);
      }
    },
    [defaultCategory]
  );

  return { trackError };
}

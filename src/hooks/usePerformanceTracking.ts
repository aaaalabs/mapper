import { useEffect } from 'react';
import { trackErrorWithContext, ErrorSeverity } from '../services/errorTracking';

// Define performance metric types
type PerformanceMetric = 'FP' | 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB';

interface PerformanceMetricEntry extends PerformanceEntry {
  name: PerformanceMetric;
  value: number;
}

const PERFORMANCE_THRESHOLDS: Record<PerformanceMetric, number> = {
  FP: 2000,    // First Paint - increased for map rendering
  FCP: 2500,   // First Contentful Paint - increased for map rendering
  LCP: 4000,   // Largest Contentful Paint - increased for map rendering
  FID: 100,    // First Input Delay
  CLS: 0.1,    // Cumulative Layout Shift
  TTFB: 800    // Time to First Byte - increased for Supabase queries
};

export function usePerformanceTracking() {
  useEffect(() => {
    // Skip performance tracking for admin routes
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }

    const observers: PerformanceObserver[] = [];

    try {
      // Track Core Web Vitals
      if ('web-vital' in window) {
        const webVitalObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const metricEntry = entry as PerformanceMetricEntry;
            const threshold = PERFORMANCE_THRESHOLDS[metricEntry.name];

            if (threshold && metricEntry.value > threshold) {
              trackErrorWithContext(
                new Error(`Performance threshold exceeded for ${metricEntry.name}`),
                {
                  category: 'SYSTEM',
                  subcategory: 'PERFORMANCE',
                  severity: ErrorSeverity.MEDIUM,
                  metadata: {
                    metric: metricEntry.name,
                    value: metricEntry.value.toString(),
                    threshold: threshold.toString(),
                    url: window.location.href
                  }
                }
              );
            }
          }
        });
        webVitalObserver.observe({ entryTypes: ['web-vital'] });
        observers.push(webVitalObserver);
      }

      // Track Long Tasks
      const longTaskObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > 100) { // Increased threshold for long tasks due to map operations
            trackErrorWithContext(
              new Error('Long task detected'),
              {
                category: 'SYSTEM',
                subcategory: 'PERFORMANCE',
                severity: ErrorSeverity.LOW,
                metadata: {
                  duration: entry.duration.toString(),
                  startTime: entry.startTime.toString(),
                  name: entry.entryType,
                  timestamp: new Date().toISOString(),
                  url: window.location.href,
                  userAgent: navigator.userAgent
                }
              }
            );
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      observers.push(longTaskObserver);

      // Track Navigation Timing
      const navObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > PERFORMANCE_THRESHOLDS.TTFB * 1.5) { // Added buffer for navigation timing
            trackErrorWithContext(
              new Error('Slow navigation timing detected'),
              {
                category: 'SYSTEM',
                subcategory: 'PERFORMANCE',
                severity: ErrorSeverity.MEDIUM,
                metadata: {
                  duration: entry.duration.toString(),
                  type: entry.entryType,
                  timestamp: new Date().toISOString(),
                  url: window.location.href
                }
              }
            );
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      observers.push(navObserver);

    } catch (error) {
      console.warn('Performance tracking not supported:', error);
    }

    // Cleanup observers on unmount
    return () => {
      observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (error) {
          console.warn('Error disconnecting observer:', error);
        }
      });
    };
  }, []); // Empty dependency array as we only want to set this up once
}

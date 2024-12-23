import { useEffect } from 'react';
import { trackEvent, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from '../services/analytics';
import { ANALYTICS_EVENTS } from '../services/analytics';

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

// Chrome-specific performance memory interface
interface ChromePerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    // Skip performance tracking for admin routes
    if (window.location.pathname.startsWith('/admin')) {
      return;
    }

    const startTime = performance.now();

    const observers: PerformanceObserver[] = [];

    try {
      // Track Core Web Vitals
      if ('web-vital' in window) {
        const webVitalObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            const metricEntry = entry as PerformanceMetricEntry;
            const threshold = PERFORMANCE_THRESHOLDS[metricEntry.name];

            if (threshold && metricEntry.value > threshold) {
              trackError(new Error(`Performance threshold exceeded for ${metricEntry.name}`), {
                category: ERROR_CATEGORY.SYSTEM,
                severity: ERROR_SEVERITY.MEDIUM,
                metadata: {
                  metric: metricEntry.name,
                  value: metricEntry.value.toString(),
                  threshold: threshold.toString(),
                  url: window.location.href
                }
              });
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
            trackError(new Error('Long task detected'), {
              category: ERROR_CATEGORY.SYSTEM,
              severity: ERROR_SEVERITY.LOW,
              metadata: {
                duration: entry.duration.toString(),
                startTime: entry.startTime.toString(),
                name: entry.entryType,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
              }
            });
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      observers.push(longTaskObserver);

      // Track Navigation Timing
      const navObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.duration > PERFORMANCE_THRESHOLDS.TTFB * 1.5) { // Added buffer for navigation timing
            trackError(new Error('Slow navigation timing detected'), {
              category: ERROR_CATEGORY.SYSTEM,
              severity: ERROR_SEVERITY.MEDIUM,
              metadata: {
                duration: entry.duration.toString(),
                type: entry.entryType,
                timestamp: new Date().toISOString(),
                url: window.location.href
              }
            });
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      observers.push(navObserver);

    } catch (error) {
      trackError(error instanceof Error ? error : new Error('Performance tracking not supported'), {
        category: ERROR_CATEGORY.SYSTEM,
        severity: ERROR_SEVERITY.LOW,
        metadata: { component: componentName }
      });
    }

    // Cleanup observers on unmount
    return () => {
      try {
        const duration = performance.now() - startTime;
        const chromePerformance = performance as ChromePerformance;
        
        trackEvent({
          event_name: ANALYTICS_EVENTS.SYSTEM.PERFORMANCE,
          event_data: {
            component: componentName,
            duration_ms: duration,
            ...(chromePerformance.memory && {
              memory: chromePerformance.memory.usedJSHeapSize
            })
          }
        });
      } catch (error) {
        trackError(error instanceof Error ? error : new Error('Performance tracking failed'), {
          category: ERROR_CATEGORY.SYSTEM,
          severity: ERROR_SEVERITY.LOW,
          metadata: { component: componentName }
        });
      }

      observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (error) {
          trackError(error instanceof Error ? error : new Error('Error disconnecting observer'), {
            category: ERROR_CATEGORY.SYSTEM,
            severity: ERROR_SEVERITY.LOW,
            metadata: { component: componentName }
          });
        }
      });
    };
  }, [componentName]);
}

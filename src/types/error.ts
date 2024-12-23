import { ErrorSeverity } from '../services/errorTracking';

export const ErrorCategories = {
  MAP: 'MAP',
  ANALYTICS: 'ANALYTICS',
  PAYMENT: 'PAYMENT',
  GEOCODING: 'GEOCODING',
  FEEDBACK: 'FEEDBACK',
  SYSTEM: 'SYSTEM',
  SESSION: 'SESSION',
  GENERAL: 'GENERAL',
} as const;

export type ErrorCategory = typeof ErrorCategories[keyof typeof ErrorCategories];

export interface ErrorContext {
  category: ErrorCategory;
  subcategory?: string;
  severity: ErrorSeverity;
  metadata?: Record<string, any>;
  componentName?: string;
}

export interface ErrorData {
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  category: ErrorCategory;
  subcategory?: string;
  severity: ErrorSeverity;
  metadata: Record<string, any>;
  url: string;
  userAgent: string;
  timestamp: string;
}

export type ErrorSubcategory<T extends ErrorCategory> = 
  T extends typeof ErrorCategories.MAP 
    ? 'CREATE' | 'UPDATE' | 'DELETE' | 'SHARE' | 'FEEDBACK'
  : T extends typeof ErrorCategories.ANALYTICS
    ? 'TRACK_EVENT' | 'TRACK_PAGEVIEW'
  : T extends typeof ErrorCategories.PAYMENT
    ? 'INITIATE' | 'PROCESS' | 'VERIFY' | 'REFUND'
  : T extends typeof ErrorCategories.GEOCODING
    ? 'ADDRESS_LOOKUP' | 'COORDINATE_LOOKUP'
  : T extends typeof ErrorCategories.SYSTEM
    ? 'PERFORMANCE' | 'MEMORY' | 'NETWORK'
  : T extends typeof ErrorCategories.SESSION
    ? 'CREATE' | 'UPDATE' | 'EXPIRE' | 'VALIDATE'
  : T extends typeof ErrorCategories.FEEDBACK
    ? 'SUBMIT' | 'UPDATE' | 'DELETE'
  : T extends typeof ErrorCategories.GENERAL
    ? 'UNKNOWN' | 'NETWORK_ERROR'
  : never;

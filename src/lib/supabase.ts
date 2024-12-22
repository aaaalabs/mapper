import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import * as Sentry from '@sentry/react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single Supabase client instance
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'mapper-admin-auth',
    flowType: 'pkce'
  },
  global: {
    fetch: async (url, options = {}) => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          // Only track errors in non-admin routes
          if (!window.location.pathname.startsWith('/admin')) {
            Sentry.captureException(new Error(`Supabase request failed: ${response.statusText}`), {
              extra: {
                url: url.toString(),
                status: response.status,
                statusText: response.statusText,
              },
            });
          }
        }
        return response;
      } catch (error) {
        // Only track errors in non-admin routes
        if (!window.location.pathname.startsWith('/admin')) {
          Sentry.captureException(error instanceof Error ? error : new Error('Supabase request failed'), {
            extra: {
              url: url.toString(),
            },
          });
        }
        throw error;
      }
    },
    headers: {
      'x-application-name': 'mapper-admin'
    }
  },
});

// Log initialization in development
if (import.meta.env.DEV) {
  console.log('Environment & Supabase initialization:', {
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    baseUrl: import.meta.env.BASE_URL,
  });
}
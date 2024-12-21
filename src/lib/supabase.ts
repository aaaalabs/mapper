import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import * as Sentry from '@sentry/react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'mapper_supabase_auth',
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
      },
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabase();
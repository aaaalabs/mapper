import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables early
if (!supabaseUrl?.startsWith('https://')) {
  throw new Error('Invalid VITE_SUPABASE_URL format');
}

if (!supabaseAnonKey?.includes('.')) {
  throw new Error('Invalid VITE_SUPABASE_ANON_KEY format');
}

// Debug logging
console.log('Environment & Supabase initialization:', {
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  baseUrl: import.meta.env.BASE_URL,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length
});

// Create singleton instance
let instance: SupabaseClient | null = null;
let healthCheckInterval: number | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!instance) {
    instance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'mapper-supabase-auth',
        autoRefreshToken: true,
        persistSession: true
      }
    });

    // Set up periodic health checks in development
    if (import.meta.env.DEV && !healthCheckInterval) {
      healthCheckInterval = window.setInterval(async () => {
        try {
          const { error } = await instance!
            .from('map_analytics_events')
            .select('id')
            .limit(1);

          if (error) {
            console.warn('Supabase health check failed:', error);
          }
        } catch (err) {
          console.error('Supabase connection error:', err);
        }
      }, 30000); // Check every 30 seconds
    }
  }
  return instance;
}

export const supabase = getSupabaseClient();

// Initial connection test
supabase.auth.getSession().catch(err => {
  console.error('Supabase connection error:', err);
});
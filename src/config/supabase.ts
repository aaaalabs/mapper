import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Try both Vite and process.env formats
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL) as string;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) as string;

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

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    viteEnv: !!import.meta.env.VITE_SUPABASE_URL,
    processEnv: !!process.env.VITE_SUPABASE_URL
  });
  throw new Error('Missing Supabase environment variables');
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('Invalid SUPABASE_URL format');
}

if (!supabaseAnonKey.includes('.')) {
  throw new Error('Invalid SUPABASE_ANON_KEY format');
}

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
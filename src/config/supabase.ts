import { supabase } from '../lib/supabase';

// Re-export the singleton client
export { supabase };

// Debug logging for development
if (import.meta.env.DEV) {
  console.log('Environment & Supabase initialization:', {
    mode: import.meta.env.MODE,
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    baseUrl: import.meta.env.BASE_URL,
  });

  // Initial connection test
  supabase.auth.getSession().catch(err => {
    console.error('Supabase connection error:', err);
  });
}
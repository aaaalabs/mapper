import { supabase } from '../lib/supabaseClient';

// Re-export the singleton client
export default supabase;
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

  // Set up periodic health checks
  setInterval(async () => {
    try {
      const { error } = await supabase
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
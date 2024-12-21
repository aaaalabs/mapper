import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single Supabase client instance
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Health check function
export const healthCheck = async () => {
  try {
    // Simple query to check connection
    const { data, error } = await supabase
      .from('map_analytics_events')
      .select('id')
      .limit(1)
      .single();

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return false;
  }
};

// Initialize function
export const initialize = async () => {
  try {
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      throw new Error('Supabase health check failed');
    }
    console.log('Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('Supabase initialization failed:', error);
    return false;
  }
};

// Initialize on load
initialize().catch(console.error);

export default supabase;
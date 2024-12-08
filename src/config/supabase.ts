import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create singleton instance
let instance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!instance) {
    instance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return instance;
}

export const supabase = getSupabaseClient();

// Test the connection
supabase.auth.getSession().catch(err => {
  console.error('Supabase connection error:', err);
});
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a single instance of the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'mapper_auth',
    detectSessionInUrl: true,
    autoRefreshToken: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

// Initialize anonymous session if needed
const initializeAnonymousSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    try {
      const timestamp = new Date().getTime();
      const { error } = await supabase.auth.signUp({
        email: `anon_${timestamp}_${Math.random().toString(36).slice(2)}@mapper.local`,
        password: crypto.randomUUID(),
      });

      if (error) {
        console.error('Error creating anonymous session:', error);
      }
    } catch (error) {
      console.error('Failed to initialize anonymous session:', error);
    }
  }
};

// Initialize the session
initializeAnonymousSession();

export default supabase;
export { supabase };
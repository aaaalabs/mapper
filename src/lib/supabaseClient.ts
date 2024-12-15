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
    autoRefreshToken: true,
    flowType: 'implicit'  // Add this to ensure proper handling of anonymous sessions
  },
  db: {
    schema: 'public'
  }
});

// Ensure we have an anonymous session
supabase.auth.getSession().then(({ data: { session } }) => {
  if (!session) {
    // Sign in anonymously if no session exists
    supabase.auth.signInWithoutPassword({});
  }
}).catch(console.error);

// Export both default and named exports
export { supabase };
export default supabase;
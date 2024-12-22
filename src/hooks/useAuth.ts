import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { ADMIN_EMAIL, AUTH_ERRORS } from '../config/auth';

/**
 * Authentication hook for Mapper
 * 
 * IMPORTANT: This hook only checks for admin@libralab.ai.
 * There are no roles, permissions, or other authenticated users.
 * All other users are treated as anonymous leads.
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const isAdminUser = user?.email === ADMIN_EMAIL;
      setIsAdmin(isAdminUser);
      setIsAuthenticated(isAdminUser);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (email !== ADMIN_EMAIL) {
      throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data?.user?.email !== ADMIN_EMAIL) {
        await supabase.auth.signOut();
        throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      setIsAdmin(true);
      setIsAuthenticated(true);
    } catch (error) {
      setIsAdmin(false);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } finally {
      setIsAdmin(false);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial session check
    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        if (session?.user?.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          setIsAuthenticated(true);
        } else {
          await supabase.auth.signOut();
          setIsAdmin(false);
          setIsAuthenticated(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAdmin(false);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isAuthenticated, isAdmin, loading, signIn, signOut };
}

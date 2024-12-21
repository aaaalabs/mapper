import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { ADMIN_EMAIL, isAdminUser, AUTH_ERRORS } from '../config/auth';

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
      setIsAdmin(isAdminUser(user?.email));
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (email !== ADMIN_EMAIL) {
      throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const isUserAuthenticated = !!user;
        setIsAuthenticated(isUserAuthenticated);
        
        if (isUserAuthenticated) {
          await checkAdminStatus();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isUserAuthenticated = !!session;
      setIsAuthenticated(isUserAuthenticated);
      
      if (isUserAuthenticated) {
        await checkAdminStatus();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { isAuthenticated, isAdmin, loading, signIn, signOut };
}

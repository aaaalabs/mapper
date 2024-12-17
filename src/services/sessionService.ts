import { supabase } from '../lib/supabaseClient';
import type { Session } from '../types/payment';

/**
 * Creates a new session for tracking user activity
 */
export const createSession = async (metadata?: Record<string, any>): Promise<Session> => {
  try {
    const user = await supabase.auth.getUser();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Sessions expire after 24 hours

    const { data: session, error } = await supabase
      .from('map_sessions')
      .insert({
        user_id: user.data.user?.id,
        metadata,
        expires_at: expiresAt.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Updates a session's status
 */
export const updateSessionStatus = async (
  sessionId: string,
  status: Session['status']
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('map_sessions')
      .update({ status })
      .eq('id', sessionId);

    if (error) {
      throw new Error(`Failed to update session status: ${error.message}`);
    }
  } catch (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
};

/**
 * Gets a session by ID
 */
export const getSession = async (sessionId: string): Promise<Session | null> => {
  try {
    const { data: session, error } = await supabase
      .from('map_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch session: ${error.message}`);
    }

    return session;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
};

/**
 * Gets all active sessions for the current user
 */
export const getUserActiveSessions = async (): Promise<Session[]> => {
  try {
    const { data: sessions, error } = await supabase
      .from('map_sessions')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user sessions: ${error.message}`);
    }

    return sessions || [];
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    throw error;
  }
};

/**
 * Expires all sessions older than 24 hours
 */
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    const { error } = await supabase
      .from('map_sessions')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      throw new Error(`Failed to cleanup expired sessions: ${error.message}`);
    }
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    throw error;
  }
};

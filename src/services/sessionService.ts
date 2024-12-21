import supabase from '../lib/supabaseClient';
import type { Session } from '../types/payment';
import { trackErrorWithContext, ErrorSeverity } from '../services/errorTracking';

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
      trackErrorWithContext(new Error(`Failed to create session: ${error.message}`), {
        category: 'SESSION',
        subcategory: 'CREATION',
        severity: ErrorSeverity.HIGH,
        metadata: {
          user_id: user.data.user?.id,
          metadata,
          error: error.message,
          code: error.code
        }
      });
      throw error;
    }

    return session;
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Session creation failed'), {
      category: 'SESSION',
      subcategory: 'CREATION',
      severity: ErrorSeverity.HIGH,
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
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
      trackErrorWithContext(new Error(`Failed to update session status: ${error.message}`), {
        category: 'SESSION',
        subcategory: 'UPDATE',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          sessionId,
          status,
          error: error.message,
          code: error.code
        }
      });
      throw error;
    }
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Session update failed'), {
      category: 'SESSION',
      subcategory: 'UPDATE',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        sessionId,
        status,
        error: error instanceof Error ? error.message : String(error)
      }
    });
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
      trackErrorWithContext(new Error(`Failed to fetch session: ${error.message}`), {
        category: 'SESSION',
        subcategory: 'FETCH',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          sessionId,
          error: error.message,
          code: error.code
        }
      });
      throw error;
    }

    return session;
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Session fetch failed'), {
      category: 'SESSION',
      subcategory: 'FETCH',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        sessionId,
        error: error instanceof Error ? error.message : String(error)
      }
    });
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
      trackErrorWithContext(new Error(`Failed to fetch user sessions: ${error.message}`), {
        category: 'SESSION',
        subcategory: 'FETCH_ALL',
        severity: ErrorSeverity.MEDIUM,
        metadata: {
          error: error.message,
          code: error.code
        }
      });
      throw error;
    }

    return sessions || [];
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Session fetch failed'), {
      category: 'SESSION',
      subcategory: 'FETCH_ALL',
      severity: ErrorSeverity.MEDIUM,
      metadata: {
        error: error instanceof Error ? error.message : String(error)
      }
    });
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
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'active');

    if (error) {
      trackErrorWithContext(new Error(`Failed to cleanup expired sessions: ${error.message}`), {
        category: 'SESSION',
        subcategory: 'CLEANUP',
        severity: ErrorSeverity.LOW,
        metadata: {
          error: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        }
      });
      throw error;
    }
  } catch (error) {
    trackErrorWithContext(error instanceof Error ? error : new Error('Session cleanup failed'), {
      category: 'SESSION',
      subcategory: 'CLEANUP',
      severity: ErrorSeverity.LOW,
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
    });
    throw error;
  }
};

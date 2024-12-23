import { supabase } from '../lib/supabase';
import type { Session } from '../types/payment';
import { trackEvent, trackError, ERROR_SEVERITY, ERROR_CATEGORY } from './analytics';
import { ANALYTICS_EVENTS } from './analytics';
import type { Database } from '../types/supabase';

type SessionInsert = Database['public']['Tables']['map_sessions']['Insert'];
type SessionUpdate = Database['public']['Tables']['map_sessions']['Update'];

const createSession = async (metadata?: Record<string, any>): Promise<Session> => {
  try {
    const session_id = crypto.randomUUID();
    const insertData: SessionInsert = {
      id: session_id,
      status: 'active',
      metadata: metadata || {},
    };

    const { data, error } = await supabase
      .from('map_sessions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    await trackEvent({
      event_name: ANALYTICS_EVENTS.SESSION.START,
      event_data: { session_id, ...metadata }
    });

    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to create session'), {
      category: ERROR_CATEGORY.SYSTEM,
      severity: ERROR_SEVERITY.HIGH,
      metadata
    });
    throw error;
  }
};

const getSession = async (sessionId: string): Promise<Session | null> => {
  try {
    const { data, error } = await supabase
      .from('map_sessions')
      .select()
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to get session'), {
      category: ERROR_CATEGORY.SYSTEM,
      severity: ERROR_SEVERITY.MEDIUM,
      metadata: { sessionId }
    });
    throw error;
  }
};

const updateSession = async (sessionId: string, metadata: Record<string, any>): Promise<Session> => {
  try {
    const updateData: SessionUpdate = {
      metadata,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('map_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to update session'), {
      category: ERROR_CATEGORY.SYSTEM,
      severity: ERROR_SEVERITY.HIGH,
      metadata: {
        sessionId,
        metadata: JSON.stringify(metadata)
      }
    });
    throw error;
  }
};

const expireSession = async (sessionId: string): Promise<Session> => {
  try {
    const updateData: SessionUpdate = {
      status: 'expired',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('map_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    await trackError(error instanceof Error ? error : new Error('Failed to expire session'), {
      category: ERROR_CATEGORY.SYSTEM,
      severity: ERROR_SEVERITY.MEDIUM,
      metadata: { sessionId }
    });
    throw error;
  }
};

export const sessionService = {
  createSession,
  getSession,
  updateSession,
  expireSession
};

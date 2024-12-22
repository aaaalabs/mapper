import { supabase } from '../lib/supabase';
import type { Session } from '../types/payment';
import { trackErrorWithContext, ErrorSeverity } from '../services/errorTracking';
import type { Database } from '../types/supabase';

type SessionInsert = Database['public']['Tables']['map_sessions']['Insert'];
type SessionUpdate = Database['public']['Tables']['map_sessions']['Update'];

const createSession = async (metadata?: Record<string, any>): Promise<Session> => {
  try {
    const insertData: SessionInsert = {
      id: crypto.randomUUID(),
      status: 'active',
      metadata: metadata || {},
    };

    const { data, error } = await supabase
      .from('map_sessions')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    await trackErrorWithContext(
      error instanceof Error ? error : new Error('Failed to create session'),
      {
        category: 'SESSION',
        subcategory: 'CREATION',
        severity: ErrorSeverity.HIGH,
        metadata
      }
    );
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
    await trackErrorWithContext(
      error instanceof Error ? error : new Error('Failed to get session'),
      {
        category: 'SESSION',
        subcategory: 'FETCH',
        severity: ErrorSeverity.MEDIUM,
        metadata: { sessionId }
      }
    );
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
    await trackErrorWithContext(
      error instanceof Error ? error : new Error('Failed to update session'),
      {
        category: 'SESSION',
        subcategory: 'UPDATE',
        severity: ErrorSeverity.HIGH,
        metadata: {
          sessionId,
          metadata: JSON.stringify(metadata)
        }
      }
    );
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
    await trackErrorWithContext(
      error instanceof Error ? error : new Error('Failed to expire session'),
      {
        category: 'SESSION',
        subcategory: 'CLEANUP',
        severity: ErrorSeverity.MEDIUM,
        metadata: { sessionId }
      }
    );
    throw error;
  }
};

export const sessionService = {
  createSession,
  getSession,
  updateSession,
  expireSession
};

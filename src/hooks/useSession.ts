import { useState, useEffect } from 'react';
import { createSession, getSession, updateSessionStatus } from '../services/sessionService';
import type { Session } from '../types/payment';

export const useSession = (metadata?: Record<string, any>) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initSession = async () => {
      try {
        // Check for existing session in localStorage
        const storedSessionId = localStorage.getItem('currentSessionId');
        
        if (storedSessionId) {
          // Try to get existing session
          const existingSession = await getSession(storedSessionId);
          if (existingSession && existingSession.status === 'active') {
            setSession(existingSession);
            setLoading(false);
            return;
          }
        }

        // Create new session if no active session exists
        const newSession = await createSession(metadata);
        localStorage.setItem('currentSessionId', newSession.id);
        setSession(newSession);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize session'));
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [metadata]);

  const completeSession = async () => {
    if (!session) return;

    try {
      await updateSessionStatus(session.id, 'completed');
      localStorage.removeItem('currentSessionId');
      setSession(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete session'));
    }
  };

  return {
    session,
    loading,
    error,
    completeSession
  };
};

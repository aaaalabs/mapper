import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface LeadEventsProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Event = {
  id: string;
  session_id: string | null;
  event_name: string;
  event_data: Record<string, any>;
  created_at: string;
  path?: string;
  user_id?: string | null;
};

export function LeadEvents({ sessionId, isOpen, onClose }: LeadEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen, sessionId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('map_analytics_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Cast the data to ensure it matches our Event type
      const typedEvents = (data || []).map(event => ({
        ...event,
        session_id: event.session_id || null,
        path: event.path || undefined
      })) as Event[];
      
      setEvents(typedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getEventColor = (eventName: string) => {
    const name = eventName.toLowerCase();
    if (name.includes('error')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (name.includes('success')) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (name.includes('warning')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const formatEventData = (data: any) => {
    if (!data) return null;
    try {
      return (
        <div className="space-y-2">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="text-sm">
              <span className="font-medium">{key}:</span>{' '}
              <span className="text-muted-foreground">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      );
    } catch {
      return <div className="text-sm text-muted-foreground">Unable to parse event data</div>;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Events - {sessionId}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="p-4 border rounded-lg bg-card"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getEventColor(event.event_name)}>
                    {event.event_name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm mb-2">
                  Path: {event.path || 'N/A'}
                </div>
                {event.event_data && (
                  <div className="mt-2 p-2 rounded bg-muted">
                    {formatEventData(event.event_data)}
                  </div>
                )}
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No events found for this lead.
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
